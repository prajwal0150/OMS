import { EVENT_STATUS, EVENT_TYPE } from '../../constants/enums';
import { ApiError } from '../../utils/ApiError';
import { ScopedCrudService } from '../../shared/ScopedCrudService';
import { buildDateRange, combineFilters, readEnum } from '../../shared/queryFilters';
import type { AuthUser } from '../../types/auth';
import { eventRepository } from './event.repository';
import type { EventDocument } from './event.model';
import { memberRepository } from '../members/member.repository';

export class EventService extends ScopedCrudService<EventDocument> {
  constructor() {
    super({
      entityLabel: 'Event',
      auditEntity: 'Event',
      repository: eventRepository,
      buildListFilter: (query) =>
        combineFilters(
          readEnum(query.type, Object.values(EVENT_TYPE)) ? { type: query.type } : {},
          query.level ? { level: query.level } : {},
          readEnum(query.status, Object.values(EVENT_STATUS)) ? { status: query.status } : {},
          typeof query.unit === 'string' && query.unit ? { unit: query.unit } : {},
          typeof query.community === 'string' && query.community
            ? { community: query.community }
            : {},
          typeof query.committee === 'string' && query.committee
            ? { committee: query.committee }
            : {},
          Object.keys(buildDateRange(query.from, query.to, { endOfDay: true })).length > 0
            ? { startDate: buildDateRange(query.from, query.to, { endOfDay: true }) }
            : {},
        ) as Record<string, unknown>,
      prepareCreate: async (user, payload) => {
        const districtId = String(payload.district ?? user.district ?? '');
        if (!districtId) throw ApiError.badRequest('A district is required to create an event');
        if (!payload.startDate) throw ApiError.badRequest('A start date is required');
        return { ...payload, district: districtId, documents: payload.documents ?? [] };
      },
    });
  }

  async upcoming(match: Record<string, unknown>, limit = 6): Promise<EventDocument[]> {
    return eventRepository.upcoming(match, limit);
  }

  async statusBreakdown(user: AuthUser) {
    const match = await eventRepository.buildFilter(user, {});
    return eventRepository.countByStatus(match as Record<string, unknown>);
  }

  async monthly(user: AuthUser, months = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    const match = await eventRepository.buildFilter(user, {});
    return eventRepository.monthlyCounts(match as Record<string, unknown>, since);
  }

  /** Member portal: events relevant to the member's unit, community or district. */
  async myEvents(user: AuthUser, query: Record<string, unknown>) {
    if (!user.member) throw ApiError.forbidden('No member profile linked to this account');
    const member = await memberRepository.findByIdScoped(user.member, user, 'Member');
    const scopeConditions: Record<string, unknown>[] = [{ level: 'DISTRICT' }];
    if (member.unit) scopeConditions.push({ unit: member.unit });
    if (member.communities?.length) scopeConditions.push({ community: { $in: member.communities } });

    const filter = combineFilters({ $or: scopeConditions }) as Record<string, unknown>;
    return eventRepository.list(user, { ...query, limit: query.limit ?? 50 }, filter);
  }
}

export const eventService = new EventService();

