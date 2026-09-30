import { refId } from '../../utils/strings';
import { COMMITTEE_LEVEL, COMMITTEE_POSITION, RECORD_STATUS } from '../../constants/enums';
import type { CommitteePosition } from '../../constants/enums';
import { ApiError } from '../../utils/ApiError';
import { ScopedCrudService } from '../../shared/ScopedCrudService';
import { combineFilters, readEnum } from '../../shared/queryFilters';
import { assertParentsInDistrict } from '../../shared/parentScope';
import type { AuthUser } from '../../types/auth';
import { committeeRepository } from './committee.repository';
import type { CommitteeDocument } from './committee.model';
import { memberRepository } from '../members/member.repository';

export interface PositionInput {
  position: CommitteePosition;
  member?: string;
  remarks?: string;
  assignedDate?: Date;
  endDate?: Date;
}

export class CommitteeService extends ScopedCrudService<CommitteeDocument> {
  constructor() {
    super({
      entityLabel: 'Committee',
      auditEntity: 'Committee',
      repository: committeeRepository,
      buildListFilter: (query) =>
        combineFilters(
          query.level ? { level: query.level } : {},
          typeof query.unit === 'string' && query.unit ? { unit: query.unit } : {},
          typeof query.community === 'string' && query.community
            ? { community: query.community }
            : {},
          readEnum(query.status, Object.values(RECORD_STATUS)) ? { status: query.status } : {},
        ) as Record<string, unknown>,
      prepareCreate: async (user, payload) => {
        const districtId = refId(payload.district) ?? String(user.district ?? '');
        if (!districtId) throw ApiError.badRequest('A district is required to create a committee');
        const level = String(payload.level ?? COMMITTEE_LEVEL.UNIT);
        const unitId = payload.unit ? String(payload.unit) : undefined;
        const communityId = payload.community ? String(payload.community) : undefined;
        if (level === COMMITTEE_LEVEL.UNIT && !unitId) {
          throw ApiError.badRequest('A unit is required for a unit level committee');
        }
        if (level === COMMITTEE_LEVEL.COMMUNITY && !communityId) {
          throw ApiError.badRequest('A community is required for a community level committee');
        }
        await assertParentsInDistrict(districtId, { unit: unitId, community: communityId });
        return { ...payload, district: districtId, positions: payload.positions ?? [] };
      },
      prepareUpdate: async (user, existing, payload) => {
        const districtId =
          refId(payload.district ?? existing.district) ?? String(user.district ?? '');
        const level = String(payload.level ?? existing.level);
        const unitId =
          payload.unit === undefined
            ? (existing.unit ? refId(existing.unit) : undefined)
            : payload.unit
              ? String(payload.unit)
              : undefined;
        const communityId =
          payload.community === undefined
            ? (existing.community ? refId(existing.community) : undefined)
            : payload.community
              ? String(payload.community)
              : undefined;
        if (level === COMMITTEE_LEVEL.UNIT && !unitId) {
          throw ApiError.badRequest('A unit is required for a unit level committee');
        }
        if (level === COMMITTEE_LEVEL.COMMUNITY && !communityId) {
          throw ApiError.badRequest('A community is required for a community level committee');
        }
        await assertParentsInDistrict(districtId, { unit: unitId, community: communityId });
        // A level change drops the parents that the new level can no longer use,
        // otherwise a district committee would keep a unit or community scope.
        const dropped =
          level === COMMITTEE_LEVEL.DISTRICT
            ? { unit: null, community: null }
            : level === COMMITTEE_LEVEL.UNIT
              ? { community: null }
              : {};
        return { ...payload, ...dropped, level };
      },
      beforeRemove: async (_user, existing) => {
        // Deleting a committee with people in it would orphan their positions.
        const assigned = (existing.positions ?? []).filter((entry) => entry.member);
        if (assigned.length > 0) {
          throw ApiError.conflict(
            'This committee still has members in its positions. Clear the positions before deleting it.',
          );
        }
      },
    });
  }

  private async assertMemberInScope(
    user: AuthUser,
    committee: CommitteeDocument,
    memberId: string,
  ) {
    const member = await memberRepository.findByIdScoped(memberId, user, 'Member');
    if (refId(member.district) !== refId(committee.district)) {
      throw ApiError.badRequest('The selected member does not belong to this district');
    }
    if (committee.unit && (refId(member.unit) ?? '') !== refId(committee.unit)) {
      throw ApiError.badRequest('The selected member does not belong to this unit');
    }
    return member;
  }

  /** Assigns a committee position and keeps the member record in sync. */
  async assignPosition(
    user: AuthUser,
    committeeId: string,
    input: PositionInput,
  ): Promise<CommitteeDocument> {
    const committee = await committeeRepository.findByIdScoped(committeeId, user, 'Committee');
    const duplicate = committee.positions.find(
      (entry) =>
        entry.position === input.position &&
        entry.active &&
        (refId(entry.member) ?? '') === (input.member ? String(input.member) : ''),
    );
    if (duplicate) {
      throw ApiError.conflict('This member already holds that position in the committee');
    }
    if (input.member) await this.assertMemberInScope(user, committee, input.member);

    const updated = await committeeRepository.addPosition(committeeId, {
      position: input.position,
      member: input.member,
      remarks: input.remarks,
      assignedDate: input.assignedDate ?? new Date(),
      endDate: input.endDate,
      active: true,
    });

    if (input.member) {
      await memberRepository.addCommitteePosition(input.member, {
        committee: committee._id,
        position: input.position,
        role: input.remarks,
        startDate: input.assignedDate ?? new Date(),
        active: true,
      });
    }
    if (!updated) throw ApiError.notFound('Committee not found');
    return updated;
  }

  async updatePosition(
    user: AuthUser,
    committeeId: string,
    positionId: string,
    input: Partial<PositionInput> & { active?: boolean },
  ): Promise<CommitteeDocument> {
    const committee = await committeeRepository.findByIdScoped(committeeId, user, 'Committee');
    const existing = committee.positions.find((entry) => String(entry._id) === positionId);
    if (!existing) throw ApiError.notFound('Committee position not found');

    const updated = await committeeRepository.updatePosition(committeeId, positionId, input);
    if (!updated) throw ApiError.notFound('Committee position not found');

    // `positions.member` arrives populated, so unwrap it with refId().
    const memberId = refId(existing.member);
    if (memberId) {
      await memberRepository.updateCommitteePosition(
        memberId,
        String(committee._id),
        existing.position,
        {
          role: input.remarks ?? existing.remarks,
          startDate: input.assignedDate ?? existing.assignedDate,
          endDate: input.endDate ?? existing.endDate,
          active: input.active ?? existing.active,
        },
      );
    }
    return updated;
  }

  async removePosition(
    user: AuthUser,
    committeeId: string,
    positionId: string,
  ): Promise<CommitteeDocument> {
    const committee = await committeeRepository.findByIdScoped(committeeId, user, 'Committee');
    const existing = committee.positions.find((entry) => String(entry._id) === positionId);
    if (!existing) throw ApiError.notFound('Committee position not found');

    const updated = await committeeRepository.removePosition(committeeId, positionId);
    // `positions.member` arrives populated, so unwrap it with refId().
    const memberId = refId(existing.member);
    if (memberId) {
      await memberRepository.removeCommitteePosition(memberId, String(committee._id), existing.position);
    }
    if (!updated) throw ApiError.notFound('Committee not found');
    return updated;
  }

  /** Committees relevant to a member (member portal). */
  async listForMember(memberId: string) {
    return committeeRepository.findForMember(memberId);
  }

  async levelBreakdown(user: AuthUser, query: Record<string, unknown> = {}) {
    const moduleFilter = this.options.buildListFilter
      ? this.options.buildListFilter(query)
      : {};
    const match = committeeRepository.buildFilter(user, moduleFilter);
    return committeeRepository.countByLevels(match as Record<string, unknown>);
  }

  static positions(): readonly string[] {
    return Object.values(COMMITTEE_POSITION);
  }
}

export const committeeService = new CommitteeService();
