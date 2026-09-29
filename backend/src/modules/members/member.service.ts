import {
  MEMBERSHIP_TYPE,
  MEMBER_STATUS,
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
      if (!unit || String(unit.district) !== String(districtId)) {
        throw ApiError.badRequest('The selected unit does not belong to the selected district');
      }
      assertWithinScope(user, { unit: String(unit._id) }, 'members');
      resolvedUnit = String(unit._id);
    }

    const communities: string[] = [];
    for (const communityId of communityIds) {
      const community = await communityRepository.findById(communityId);
      if (!community || String(community.district) !== String(districtId)) {
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
    return memberRepository.create({
      ...withScope,
      memberId,
      district: districtId,
      ...(context.unit ? { unit: context.unit } : {}),
      communities: context.communities,
      committeePositions: [],
      status: withScope.status ?? MEMBER_STATUS.PENDING,
      createdBy: user.id,
      updatedBy: user.id,
    });
  }

  /** Administrator update path (organization fields included). */
  async update(
    user: AuthUser,
    id: string,
    payload: Record<string, unknown>,
  ): Promise<MemberDocument> {
    const existing = await memberRepository.findByIdScoped(id, user, 'Member');
    const next: Record<string, unknown> = { ...payload };
    const districtId = String(next.district ?? existing.district);
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
