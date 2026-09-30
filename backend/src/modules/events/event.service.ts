import { EVENT_LEVEL, EVENT_STATUS, EVENT_TYPE } from '../../constants/enums';
import { ApiError } from '../../utils/ApiError';
import { refId } from '../../utils/strings';
import { ScopedCrudService } from '../../shared/ScopedCrudService';
import { assertParentsInDistrict } from '../../shared/parentScope';
import { buildDateRange, combineFilters, readEnum } from '../../shared/queryFilters';
import type { AuthUser } from '../../types/auth';
import { eventRepository } from './event.repository';
import type { EventDocument } from './event.model';
import { memberRepository } from '../members/member.repository';
import { attendanceRepository } from '../attendance/attendance.repository';

/** An event may only be pinned to a parent that lives in its own district. */
const resolveParents = async (
  districtId: string,
  level: string,
  payload: Record<string, unknown>,
): Promise<{ unit?: string; community?: string; committee?: string }> => {
  const unit = payload.unit ? String(payload.unit) : undefined;
  const community = payload.community ? String(payload.community) : undefined;
  const committee = payload.committee ? String(payload.committee) : undefined;

  if (level === EVENT_LEVEL.UNIT && !unit) {
    throw ApiError.badRequest('A unit is required for a unit level event');
  }
  if (level === EVENT_LEVEL.COMMUNITY && !community) {
    throw ApiError.badRequest('A community is required for a community level event');
  }
  if (level === EVENT_LEVEL.COMMITTEE && !committee) {
    throw ApiError.badRequest('A committee is required for a committee level event');
  }

  await assertParentsInDistrict(districtId, { unit, community, committee });
  return { unit, community, committee };
};

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
        const districtId = refId(payload.district) ?? String(user.district ?? '');
        if (!districtId) throw ApiError.badRequest('A district is required to create an event');
        if (!payload.startDate) throw ApiError.badRequest('A start date is required');
        const level = String(payload.level ?? EVENT_LEVEL.DISTRICT);
        await resolveParents(districtId, level, payload);
        return { ...payload, district: districtId, level, documents: payload.documents ?? [] };
      },
      prepareUpdate: async (user, existing, payload) => {
        // `existing` arrives populated, so every ref is unwrapped with refId().
        const districtId =
          refId(payload.district ?? existing.district) ?? String(user.district ?? '');
        const level = String(payload.level ?? existing.level);
        const merged = {
          unit: payload.unit !== undefined ? payload.unit : refId(existing.unit),
          community:
            payload.community !== undefined ? payload.community : refId(existing.community),
          committee:
            payload.committee !== undefined ? payload.committee : refId(existing.committee),
        };
        await resolveParents(districtId, level, merged);
        // A level change drops the parents the new level can no longer use.
        return {
          ...payload,
          level,
          ...(level === EVENT_LEVEL.DISTRICT ? { unit: null, community: null, committee: null } : {}),
        };
      },
      beforeRemove: async (_user, existing) => {
        // Attendance rows point at the event, so it may not just disappear.
        const marked = await attendanceRepository.count(null, { event: existing._id });
        if (marked > 0) {
          throw ApiError.conflict(
            'This event already has attendance records. Remove the attendance before deleting it.',
          );
        }
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

