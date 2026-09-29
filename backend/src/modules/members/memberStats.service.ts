import { MEMBER_STATUS } from '../../constants/enums';
import { buildScopeFilter } from '../../shared/scope';
import { combineFilters } from '../../shared/queryFilters';
import type { AuthUser } from '../../types/auth';
import { memberRepository } from './member.repository';
import { memberService } from './member.service';
import { unitRepository } from '../units/unit.repository';
import { communityRepository } from '../communities/community.repository';

export interface Breakdown {
  key: string;
  label: string;
  count: number;
}

export interface MemberStatusSummary {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  suspended: number;
}

/** Member analytics for dashboards and the member report (always scope aware). */
export class MemberStatsService {
  private match(user: AuthUser, query: Record<string, unknown> = {}): Record<string, unknown> {
    return combineFilters(
      buildScopeFilter(user),
      memberService.buildListFilter(query),
    ) as Record<string, unknown>;
  }

  async statusSummary(
    user: AuthUser,
    query: Record<string, unknown> = {},
  ): Promise<MemberStatusSummary> {
    const match = this.match(user, query);
    const counts = await memberRepository.plainGroupedCounts(match, 'status');
    const total = await memberRepository.count(null, match);
    const pick = (status: string) => counts.find((row) => row.key === status)?.count ?? 0;
    return {
      total,
      active: pick(MEMBER_STATUS.ACTIVE),
      pending: pick(MEMBER_STATUS.PENDING),
      inactive: pick(MEMBER_STATUS.INACTIVE),
      suspended: pick(MEMBER_STATUS.SUSPENDED),
    };
  }

  async byUnit(user: AuthUser, query: Record<string, unknown> = {}): Promise<Breakdown[]> {
    const rows = await memberRepository.plainGroupedCounts(this.match(user, query), 'unit');
    const units = await unitRepository.list(null, { limit: 200, sort: 'name', order: 'asc' }, {});
    const labels = new Map(units.items.map((unit) => [String(unit._id), unit.name]));
    return rows.map((row) => ({
      key: row.key,
      label: labels.get(row.key) ?? 'Unassigned',
      count: row.count,
    }));
  }

  async byCommunity(user: AuthUser, query: Record<string, unknown> = {}): Promise<Breakdown[]> {
    const rows = await memberRepository.communityGroupedCounts(this.match(user, query));
    const communities = await communityRepository.list(
      null,
      { limit: 200, sort: 'name', order: 'asc' },
      {},
    );
    const labels = new Map(
      communities.items.map((community) => [String(community._id), community.name]),
    );
    return rows.map((row) => ({
      key: row.key,
      label: labels.get(row.key) ?? 'Unknown community',
      count: row.count,
    }));
  }

  async byGender(user: AuthUser, query: Record<string, unknown> = {}): Promise<Breakdown[]> {
    const rows = await memberRepository.plainGroupedCounts(this.match(user, query), 'gender');
    return rows.map((row) => ({ key: row.key, label: row.key, count: row.count }));
  }

  async byMembershipType(
    user: AuthUser,
    query: Record<string, unknown> = {},
  ): Promise<Breakdown[]> {
    const rows = await memberRepository.plainGroupedCounts(
      this.match(user, query),
      'membershipType',
    );
    return rows.map((row) => ({ key: row.key, label: row.key, count: row.count }));
  }

  /** Member registrations per month for the growth chart. */
  async growth(user: AuthUser, months = 12): Promise<Array<{ month: string; count: number }>> {
    const since = new Date();
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    since.setMonth(since.getMonth() - (months - 1));

    const created = await memberRepository.createdAtValues(buildScopeFilter(user), since);
    const buckets = new Map<string, number>();
    for (let index = 0; index < months; index += 1) {
      const date = new Date(since.getFullYear(), since.getMonth() + index, 1);
      buckets.set(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, 0);
    }
    created.forEach((date) => {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });

    return Array.from(buckets.entries()).map(([month, count]) => ({ month, count }));
  }

  /** Full member report payload (summary, breakdowns and table rows). */
  async report(user: AuthUser, query: Record<string, unknown>, limit = 200) {
    const summary = await this.statusSummary(user, query);
    const byUnit = await this.byUnit(user, query);
    const byCommunity = await this.byCommunity(user, query);
    const byGender = await this.byGender(user, query);
    const byMembershipType = await this.byMembershipType(user, query);
    const { items, meta } = await memberRepository.list(
      user,
      { ...query, limit },
      memberService.buildListFilter(query),
    );

    return {
      summary,
      byUnit,
      byCommunity,
      byGender,
      byMembershipType,
      rows: items.map((member) => ({
        memberId: member.memberId,
        name: [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' '),
        gender: member.gender ?? '—',
        phone: member.phone ?? '—',
        email: member.email ?? '—',
        unit: (member.unit as unknown as { name?: string } | undefined)?.name ?? '—',
        communities: (member.communities ?? [])
          .map((community) => (community as unknown as { name?: string } | undefined)?.name ?? '')
          .filter(Boolean)
          .join(', '),
        membershipType: member.membershipType,
        status: member.status,
        joinedDate: member.joinedDate
          ? new Date(member.joinedDate).toISOString().slice(0, 10)
          : '—',
      })),
      meta,
    };
  }
}

export const memberStatsService = new MemberStatsService();
