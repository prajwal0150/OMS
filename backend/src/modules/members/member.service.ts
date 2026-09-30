import {
  ACCOUNT_STATUS,
  MEMBERSHIP_TYPE,
  MEMBER_STATUS,
  NOTIFICATION_TYPE,
  REGISTRATION_STATUS,
} from '../../constants/enums';
import { isValidObjectId } from 'mongoose';
import { ApiError } from '../../utils/ApiError';
import { assertWithinScope, applyScopeDefaults } from '../../shared/scope';
import { combineFilters, readDate, readEnum } from '../../shared/queryFilters';
import type { AuthUser } from '../../types/auth';
import type { CrudListResult } from '../../shared/crudController';
import { memberRepository } from './member.repository';
import type { MemberDocument } from './member.model';
import { generateMemberId } from './memberId.service';
import { unitRepository } from '../units/unit.repository';
import { communityRepository } from '../communities/community.repository';
import { userRepository } from '../users/user.repository';
import { ROLE_NAMES } from '../../constants/roles';
import { notificationService } from '../notifications/notification.service';
import { refId } from '../../utils/strings';

/** Personal fields a member may maintain themselves (never role/scope/status). */
export const SELF_EDITABLE_FIELDS = [
  'phone',
  'email',
  'address',
  'municipality',
  'ward',
  'emergencyContact',
  'occupation',
  'education',
  'photo',
] as const;

/** Fields that only administrators may change. */
export const ORGANIZATIONAL_FIELDS = [
  'district',
  'unit',
  'communities',
  'committeePositions',
  'membershipType',
  'status',
  'dateOfBirth',
  'gender',
  'joinedDate',
  'notes',
] as const;

/** Bookkeeping fields owned by the registration approval workflow. */
export const REGISTRATION_FIELDS = [
  'registrationStatus',
  'registrationRequestedBy',
  'registrationRequestedAt',
  'registrationReviewedBy',
  'registrationReviewedAt',
  'registrationReviewNote',
] as const;

/** Registrations made below district level must be approved by the district. */
export const requiresDistrictApproval = (user: AuthUser): boolean =>
  user.role !== ROLE_NAMES.SUPER_ADMIN &&
  user.role !== ROLE_NAMES.DISTRICT_ADMIN &&
  user.role !== ROLE_NAMES.DISTRICT_COMMITTEE_MEMBER;

export class MemberService {
  /** Resolves a unit query value (id or name/code) to an identifier. */
  private async resolveUnitId(value: string | undefined): Promise<string | undefined> {
    if (!value) return undefined;
    if (isValidObjectId(value)) return value;
    const unit = await unitRepository.findOne({
      $or: [{ name: value }, { code: value.toUpperCase() }],
    });
    return unit ? String(unit._id) : undefined;
  }

  /** Resolves a community query value (id or name/code) to an identifier. */
  private async resolveCommunityId(value: string | undefined): Promise<string[]> {
    if (!value) return [];
    if (isValidObjectId(value)) return [value];
    const community = await communityRepository.findOne({
      $or: [{ name: value }, { code: value.toUpperCase() }],
    });
    return community ? [String(community._id)] : [];
  }

  buildListFilter(query: Record<string, unknown>): Record<string, unknown> {
    const unit = typeof query.unit === 'string' && query.unit ? { unit: query.unit } : {};
    const community =
      typeof query.community === 'string' && query.community
        ? { communities: query.community }
        : {};
    const gender = readEnum(query.gender, ['MALE', 'FEMALE', 'OTHER']);
    const status = readEnum(query.status, Object.values(MEMBER_STATUS));
    const membershipType = readEnum(query.membershipType, Object.values(MEMBERSHIP_TYPE));

    const joinedFrom = readDate(query.joinedFrom);
    const joinedTo = readDate(query.joinedTo);
    const joinedRange: Record<string, unknown> = {};
    if (joinedFrom || joinedTo) {
      joinedRange.joinedDate = {
        ...(joinedFrom ? { $gte: joinedFrom } : {}),
        ...(joinedTo ? { $lte: joinedTo } : {}),
      };
    }

    return combineFilters(
      unit,
      community,
      gender ? { gender } : {},
      status ? { status } : {},
      membershipType ? { membershipType } : {},
      joinedRange,
    ) as Record<string, unknown>;
  }

  /** List filter with name/code resolution for unit and community selectors. */
  async buildListFilterResolved(
    query: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const filter = this.buildListFilter(query);
    const unitValue = typeof query.unit === 'string' && query.unit ? query.unit : undefined;
    if (unitValue) {
      const resolved = await this.resolveUnitId(unitValue);
      if (resolved) {
        return { ...filter, unit: resolved };
      }
      return { ...filter, unit: undefined };
    }
    const communityValue =
      typeof query.community === 'string' && query.community ? query.community : undefined;
    if (communityValue) {
      const resolved = await this.resolveCommunityId(communityValue);
      return { ...filter, communities: { $in: resolved } };
    }
    return filter;
  }

  /** District admins (and the super admin) are told about new requests. */
  private async notifyRegistrationRequested(
    member: MemberDocument,
    actor: AuthUser,
  ): Promise<void> {
    try {
      const districtId = refId(member.district) ?? '';
      const [districtAdmins, superAdmins] = await Promise.all([
        userRepository.list(
          null,
          { limit: 200 },
          { role: ROLE_NAMES.DISTRICT_ADMIN, district: districtId, status: ACCOUNT_STATUS.ACTIVE },
        ),
        userRepository.list(
          null,
          { limit: 50 },
          { role: ROLE_NAMES.SUPER_ADMIN, status: ACCOUNT_STATUS.ACTIVE },
        ),
      ]);
      const recipients = [...districtAdmins.items, ...superAdmins.items].map((entry) =>
        String(entry._id),
      );
      if (recipients.length === 0) return;

      const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ');
      const unitId = refId(member.unit);
      const unit = unitId ? await unitRepository.findById(unitId) : null;
      await notificationService.notifyUsers(recipients, {
        type: NOTIFICATION_TYPE.MEMBER_REGISTRATION,
        title: 'Member registration awaiting approval',
        message: `${fullName} (${member.memberId})${unit ? ` — ${unit.name}` : ''} has been registered and needs district approval.`,
        link: '/admin/members/requests',
        entity: 'Member',
        entityId: String(member._id),
        district: districtId,
        createdBy: actor.id,
      });
    } catch (error) {
      console.error('[members] registration request notification failed', error);
    }
  }

  /** Tells the requester (and the new member, once active) how the review went. */
  private async notifyReviewDecision(
    member: MemberDocument,
    reviewer: AuthUser,
    approved: boolean,
    note?: string,
  ): Promise<void> {
    try {
      const requesterId = refId(member.registrationRequestedBy);
      const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ');
      const districtId = refId(member.district);

      const recipients: string[] = requesterId ? [requesterId] : [];
      const account = await userRepository.findOne({ member: member._id });
      if (approved && account && account.status === ACCOUNT_STATUS.ACTIVE) {
        recipients.push(String(account._id));
      }
      if (recipients.length === 0) return;

      await notificationService.notifyUsers(recipients, {
        type: NOTIFICATION_TYPE.MEMBER_REGISTRATION,
        title: approved ? 'Member registration approved' : 'Member registration rejected',
        message: approved
          ? `${fullName} (${member.memberId}) was approved and can now sign in to the member portal.`
          : `${fullName} (${member.memberId}) was rejected${note ? `: ${note}` : '.'}`,
        link: approved ? `/admin/members/${String(member._id)}` : '/admin/members/requests',
        entity: 'Member',
        entityId: String(member._id),
        ...(districtId ? { district: districtId } : {}),
        createdBy: reviewer.id,
      });
    } catch (error) {
      console.error('[members] registration review notification failed', error);
    }
  }

  /** Registration requests waiting for district approval (scope enforced). */
  async listRegistrationRequests(
    user: AuthUser,
    query: Record<string, unknown>,
  ): Promise<CrudListResult<MemberDocument>> {
    const { items, meta } = await memberRepository.list(user, query, {
      registrationStatus: REGISTRATION_STATUS.PENDING,
    });

    const requesterIds = Array.from(
      new Set(
        items
          .map((item) => refId(item.registrationRequestedBy))
          .filter((value): value is string => Boolean(value)),
      ),
    );
    const names = new Map<string, string>();
    if (requesterIds.length > 0) {
      const { items: requesters } = await userRepository.list(
        null,
        { limit: requesterIds.length },
        { _id: { $in: requesterIds } },
      );
      for (const requester of requesters) {
        names.set(
          String(requester._id),
          `${requester.firstName ?? ''} ${requester.lastName ?? ''}`.trim() ||
            String(requester.email ?? ''),
        );
      }
    }

    const enriched = items.map((item) => ({
      ...(item as unknown as Record<string, unknown>),
      registrationRequestedByName:
        names.get(refId(item.registrationRequestedBy) ?? '') ?? null,
    }));
    return { items: enriched as unknown as MemberDocument[], meta };
  }

  /** District approval: activates the member and any provisional login. */
  async approveRegistration(
    user: AuthUser,
    id: string,
    note?: string,
  ): Promise<Record<string, unknown>> {
    const member = await memberRepository.findByIdScoped(id, user, 'Member');
    this.assertAwaitingReview(member);

    await memberRepository.updateById(String(member._id), {
      status: MEMBER_STATUS.ACTIVE,
      registrationStatus: REGISTRATION_STATUS.APPROVED,
      registrationReviewedBy: user.id,
      registrationReviewedAt: new Date(),
      ...(note ? { registrationReviewNote: note } : {}),
      updatedBy: user.id,
    });

    // A login provisioned ahead of the review becomes usable now.
    const account = await userRepository.findOne({ member: member._id });
    if (account && account.status === ACCOUNT_STATUS.PENDING) {
      await userRepository.updateById(String(account._id), {
        status: ACCOUNT_STATUS.ACTIVE,
        loginAttempts: 0,
        lockedUntil: null,
        updatedBy: user.id,
      });
      await userRepository.revokeAllRefreshTokens(String(account._id));
    }

    await this.notifyReviewDecision(member, user, true, note);
    const refreshed = await memberRepository.findById(String(member._id));
    return (refreshed ?? member) as unknown as Record<string, unknown>;
  }

  /** Rejection keeps the member and any provisional login unusable. */
  async rejectRegistration(
    user: AuthUser,
    id: string,
    reason: string,
  ): Promise<Record<string, unknown>> {
    const member = await memberRepository.findByIdScoped(id, user, 'Member');
    this.assertAwaitingReview(member);

    await memberRepository.updateById(String(member._id), {
      registrationStatus: REGISTRATION_STATUS.REJECTED,
      registrationReviewedBy: user.id,
      registrationReviewedAt: new Date(),
      registrationReviewNote: reason,
      updatedBy: user.id,
    });

    await this.notifyReviewDecision(member, user, false, reason);
    const refreshed = await memberRepository.findById(String(member._id));
    return (refreshed ?? member) as unknown as Record<string, unknown>;
  }

  private assertAwaitingReview(member: MemberDocument): void {
    if (member.registrationStatus !== REGISTRATION_STATUS.PENDING) {
      throw ApiError.conflict('This member has no registration request awaiting review');
    }
  }

  async list(
    user: AuthUser,
    query: Record<string, unknown>,
  ): Promise<CrudListResult<MemberDocument>> {
    const { items, meta } = await memberRepository.list(
      user,
      query,
      await this.buildListFilterResolved(query),
    );
    return { items, meta };
  }

  async getById(user: AuthUser, id: string): Promise<Record<string, unknown>> {
    const member = await memberRepository.findByIdScoped(id, user, 'Member');
    const account = await userRepository.findOne({ member: member._id });
    return {
      ...(member as unknown as Record<string, unknown>),
      account: account
        ? {
            id: String(account._id),
            email: account.email,
            status: account.status,
            role: account.role,
            lastLogin: account.lastLogin,
            forcePasswordChange: account.forcePasswordChange,
          }
        : null,
    };
  }

  /** Validates unit and community selections against the caller's scope. */
  private async resolveOrganizationContext(
    user: AuthUser,
    districtId: string,
    unitId?: string,
    communityIds: string[] = [],
  ): Promise<{ unit?: string; communities: string[] }> {
    let resolvedUnit: string | undefined;
    if (unitId) {
      const unit = await unitRepository.findById(unitId);
      if (!unit || refId(unit.district) !== String(districtId)) {
        throw ApiError.badRequest('The selected unit does not belong to the selected district');
      }
      assertWithinScope(user, { unit: String(unit._id) }, 'members');
      resolvedUnit = String(unit._id);
    }

    const communities: string[] = [];
    for (const communityId of communityIds) {
      const community = await communityRepository.findById(communityId);
      if (!community || refId(community.district) !== String(districtId)) {
        throw ApiError.badRequest('A selected community does not belong to the selected district');
      }
      assertWithinScope(user, { community: String(community._id) }, 'members');
      communities.push(String(community._id));
    }

    return { ...(resolvedUnit ? { unit: resolvedUnit } : {}), communities };
  }

  async create(user: AuthUser, payload: Record<string, unknown>): Promise<MemberDocument> {
    const withScope = applyScopeDefaults(user, payload);
    const districtId = String(withScope.district ?? '');
    if (!districtId) throw ApiError.badRequest('A district is required to register a member');
    assertWithinScope(user, { district: districtId }, 'members');

    const unitId = typeof withScope.unit === 'string' ? withScope.unit : undefined;
    const communityIds = Array.isArray(withScope.communities)
      ? (withScope.communities as unknown[]).map(String)
      : [];
    const context = await this.resolveOrganizationContext(user, districtId, unitId, communityIds);

    const memberId = await generateMemberId(districtId);

    // Clients can never submit approval bookkeeping through the CRUD payload.
    const clean: Record<string, unknown> = { ...withScope };
    for (const field of REGISTRATION_FIELDS) delete clean[field];

    const needsApproval = requiresDistrictApproval(user);
    if (needsApproval) {
      // Unit/community registrations stay pending until the district approves.
      clean.status = MEMBER_STATUS.PENDING;
      clean.registrationStatus = REGISTRATION_STATUS.PENDING;
      clean.registrationRequestedBy = user.id;
      clean.registrationRequestedAt = new Date();
    }

    const created = await memberRepository.create({
      ...clean,
      memberId,
      district: districtId,
      ...(context.unit ? { unit: context.unit } : {}),
      communities: context.communities,
      committeePositions: [],
      status: (clean.status as string) ?? MEMBER_STATUS.PENDING,
      createdBy: user.id,
      updatedBy: user.id,
    });

    if (needsApproval) await this.notifyRegistrationRequested(created, user);
    return created;
  }

  /** Administrator update path (organization fields included). */
  async update(
    user: AuthUser,
    id: string,
    payload: Record<string, unknown>,
  ): Promise<MemberDocument> {
    const existing = await memberRepository.findByIdScoped(id, user, 'Member');
    const next: Record<string, unknown> = { ...payload };
    // `existing.district` arrives populated, so unwrap it with refId().
    const districtId = refId(next.district ?? existing.district) ?? '';
    assertWithinScope(user, { district: districtId }, 'members');

    if (next.unit !== undefined) {
      const unitId = next.unit ? String(next.unit) : undefined;
      const context = await this.resolveOrganizationContext(user, districtId, unitId, []);
      next.unit = context.unit ?? null;
    }
    if (next.communities !== undefined) {
      const communityIds = Array.isArray(next.communities)
        ? (next.communities as unknown[]).map(String)
        : [];
      const context = await this.resolveOrganizationContext(
        user,
        districtId,
        typeof next.unit === 'string' ? next.unit : String(existing.unit ?? ''),
        communityIds,
      );
      next.communities = context.communities;
    }

    delete next.memberId;
    for (const field of REGISTRATION_FIELDS) delete next[field];

    // A unit level account may not activate a member before district approval.
    if (
      requiresDistrictApproval(user) &&
      existing.registrationStatus === REGISTRATION_STATUS.PENDING &&
      next.status !== undefined &&
      next.status !== MEMBER_STATUS.PENDING
    ) {
      throw ApiError.forbidden(
        'This registration must be approved by the district administrator first',
      );
    }

    const updated = await memberRepository.updateById(id, { ...next, updatedBy: user.id });
    if (!updated) throw ApiError.notFound('Member not found');
    return updated;
  }

  /** Member self service â€” organization fields cannot be changed here. */
  async updateOwnProfile(
    user: AuthUser,
    id: string,
    payload: Record<string, unknown>,
  ): Promise<MemberDocument> {
    if (!user.member || String(user.member) !== String(id)) {
      throw ApiError.forbidden('You can only update your own profile');
    }
    const safe: Record<string, unknown> = {};
    for (const field of SELF_EDITABLE_FIELDS) {
      if (payload[field] !== undefined) safe[field] = payload[field];
    }
    const updated = await memberRepository.updateById(id, safe);
    if (!updated) throw ApiError.notFound('Member not found');
    return updated;
  }

  async remove(user: AuthUser, id: string): Promise<void> {
    const member = await memberRepository.findByIdScoped(id, user, 'Member');
    const accounts = await userRepository.count(null, { member: member._id });
    if (accounts > 0) {
      throw ApiError.conflict(
        'This member still has a login account. Deactivate or delete the account first.',
      );
    }
    // Deleting a member would leave a committee seat pointing at nobody.
    const seats = (member.committeePositions ?? []).filter((entry) => entry.active);
    if (seats.length > 0) {
      throw ApiError.conflict(
        'This member still holds a committee position. Clear the position before deleting the member.',
      );
    }
    await memberRepository.deleteById(id);
  }

  /** Member portal: own profile plus account summary. */
  async getOwnProfile(user: AuthUser): Promise<Record<string, unknown>> {
    if (!user.member) throw ApiError.forbidden('No member profile is linked to this account');
    const member = await memberRepository.findByIdScoped(user.member, user, 'Member');
    const account = await userRepository.findById(user.id);
    return {
      ...(member as unknown as Record<string, unknown>),
      account: account
        ? {
            id: String(account._id),
            email: account.email,
            status: account.status,
            role: account.role,
            lastLogin: account.lastLogin,
          }
        : null,
    };
  }
}

export const memberService = new MemberService();
