import { refId } from '../../utils/strings';
import { ATTENDANCE_STATUS, AUDIT_ACTION } from '../../constants/enums';
import type { AttendanceStatus } from '../../constants/enums';
import { ApiError } from '../../utils/ApiError';
import { ScopedCrudService } from '../../shared/ScopedCrudService';
import { buildDateRange, combineFilters, readEnum } from '../../shared/queryFilters';
import type { AuthUser } from '../../types/auth';
import { attendanceRepository } from './attendance.repository';
import type { AttendanceDocument } from './attendance.model';
import { eventRepository } from '../events/event.repository';
import { memberRepository } from '../members/member.repository';

export interface AttendanceRecordInput {
  member: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
}

export interface BulkAttendanceInput {
  event: string;
  date: string;
  records: AttendanceRecordInput[];
}

export class AttendanceService extends ScopedCrudService<AttendanceDocument> {
  constructor() {
    super({
      entityLabel: 'Attendance',
      auditEntity: 'Attendance',
      repository: attendanceRepository,
      buildListFilter: (query) =>
        combineFilters(
          typeof query.event === 'string' && query.event ? { event: query.event } : {},
          typeof query.member === 'string' && query.member ? { member: query.member } : {},
          typeof query.unit === 'string' && query.unit ? { unit: query.unit } : {},
          typeof query.community === 'string' && query.community
            ? { community: query.community }
            : {},
          readEnum(query.status, Object.values(ATTENDANCE_STATUS)) ? { status: query.status } : {},
          Object.keys(buildDateRange(query.from, query.to, { endOfDay: true })).length > 0
            ? { date: buildDateRange(query.from, query.to, { endOfDay: true }) }
            : {},
        ) as Record<string, unknown>,
    });
  }

  /** Records (or corrects) attendance for one or many members in a single call. */
  async markBulk(user: AuthUser, input: BulkAttendanceInput) {
    const event = await eventRepository.findByIdScoped(input.event, user, 'Event');
    const date = new Date(input.date);
    if (Number.isNaN(date.getTime())) {
      throw ApiError.badRequest('A valid attendance date is required');
    }
    if (input.records.length === 0) throw ApiError.badRequest('No attendance records submitted');

    const results: AttendanceDocument[] = [];
    for (const record of input.records) {
      const member = await memberRepository.findByIdScoped(record.member, user, 'Member');
      if (refId(member.district) !== refId(event.district)) {
        throw ApiError.badRequest('A selected member does not belong to this district');
      }
      const saved = await attendanceRepository.upsertForEventAndMember(
        String(event._id),
        String(member._id),
        {
          date,
          status: record.status,
          checkIn: record.checkIn,
          checkOut: record.checkOut,
          remarks: record.remarks,
          district: event.district,
          unit: event.unit ?? member.unit,
          community: event.community ?? member.communities?.[0],
          markedBy: user.id,
        },
      );
      if (saved) results.push(saved);
    }

    await this.audit(
      AUDIT_ACTION.CREATE,
      String(event._id),
      `Attendance recorded for ${results.length} member(s) on ${date.toISOString().slice(0, 10)}`,
      user,
    );
    return { saved: results.length, records: results };
  }

  async markIndividual(
    user: AuthUser,
    input: {
      member: string;
      event: string;
      date: string;
      status: AttendanceStatus;
      checkIn?: string;
      checkOut?: string;
      remarks?: string;
    },
  ) {
    const result = await this.markBulk(user, {
      event: input.event,
      date: input.date,
      records: [
        {
          member: input.member,
          status: input.status,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          remarks: input.remarks,
        },
      ],
    });
    return result.records[0];
  }

  /** Roster for an event: every expected member plus recorded attendance. */
  async eventRoster(user: AuthUser, eventId: string) {
    const event = await eventRepository.findByIdScoped(eventId, user, 'Event');
    const memberFilter: Record<string, unknown> = {};
    if (event.unit) memberFilter.unit = event.unit;
    if (event.community) memberFilter.communities = event.community;
    if (Object.keys(memberFilter).length === 0) memberFilter.district = event.district;

    const members = await memberRepository.list(
      user,
      { limit: 200, sort: 'firstName', order: 'asc' },
      memberFilter,
    );
    const existing = await attendanceRepository.list(user, { limit: 200 }, { event: eventId });
    const map = new Map(existing.items.map((item) => [String(item.member), item]));

    return {
      event,
      roster: members.items.map((member) => ({
        member: {
          id: String(member._id),
          memberId: member.memberId,
          name: [member.firstName, member.middleName, member.lastName].filter(Boolean).join(' '),
          photo: member.photo,
          unit: (member.unit as unknown as { name?: string } | undefined)?.name ?? null,
        },
        attendance: map.get(String(member._id)) ?? null,
      })),
    };
  }

  async summary(user: AuthUser, query: Record<string, unknown> = {}) {
    const filter = this.options.buildListFilter ? this.options.buildListFilter(query) : {};
    const match = attendanceRepository.buildFilter(user, filter);
    const counts = await attendanceRepository.countByStatus(match as Record<string, unknown>);
    const total = counts.reduce((sum, row) => sum + row.count, 0);
    const pick = (status: string) => counts.find((row) => row.key === status)?.count ?? 0;
    const present = pick(ATTENDANCE_STATUS.PRESENT);
    const late = pick(ATTENDANCE_STATUS.LATE);
    return {
      total,
      present,
      absent: pick(ATTENDANCE_STATUS.ABSENT),
      late,
      excused: pick(ATTENDANCE_STATUS.EXCUSED),
      attendancePercentage:
        total === 0 ? 0 : Number((((present + late) / total) * 100).toFixed(1)),
    };
  }

  async monthlyTrend(user: AuthUser, months = 12, query: Record<string, unknown> = {}) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);
    const filter = this.options.buildListFilter ? this.options.buildListFilter(query) : {};
    const match = attendanceRepository.buildFilter(user, filter);
    return attendanceRepository.monthlyTrend(match as Record<string, unknown>, since);
  }

  async eventParticipation(user: AuthUser, limit = 8, query: Record<string, unknown> = {}) {
    const filter = this.options.buildListFilter ? this.options.buildListFilter(query) : {};
    const match = attendanceRepository.buildFilter(user, filter);
    return attendanceRepository.eventTotals(match as Record<string, unknown>, limit);
  }

  /** Member portal: own attendance history. */
  async myAttendance(user: AuthUser, query: Record<string, unknown>) {
    if (!user.member) throw ApiError.forbidden('No member profile linked to this account');
    const { items, meta } = await attendanceRepository.list(
      user,
      { ...query, limit: query.limit ?? 100 },
      { member: user.member },
    );
    return { items, meta };
  }

  async mySummary(user: AuthUser) {
    if (!user.member) throw ApiError.forbidden('No member profile linked to this account');
    return this.summary(user, { member: user.member });
  }

  /** Attendance report payload (summary, per event table and member level rows). */
  async report(user: AuthUser, query: Record<string, unknown>, limit = 200) {
    const filter = this.options.buildListFilter ? this.options.buildListFilter(query) : {};
    const match = attendanceRepository.buildFilter(user, filter);
    const summary = await this.summary(user, query);
    const perEvent = await attendanceRepository.eventTotals(match as Record<string, unknown>, 50);
    const { items } = await attendanceRepository.list(user, { ...query, limit }, filter);

    return {
      summary,
      perEvent,
      rows: items.map((record) => ({
        date: new Date(record.date).toISOString().slice(0, 10),
        event: (record.event as unknown as { title?: string } | undefined)?.title ?? 'â€”',
        member:
          [
            (record.member as unknown as { firstName?: string; lastName?: string } | undefined)
              ?.firstName,
            (record.member as unknown as { lastName?: string } | undefined)?.lastName,
          ]
            .filter(Boolean)
            .join(' ') || 'â€”',
        memberId:
          (record.member as unknown as { memberId?: string } | undefined)?.memberId ?? 'â€”',
        unit: (record.unit as unknown as { name?: string } | undefined)?.name ?? 'â€”',
        community: (record.community as unknown as { name?: string } | undefined)?.name ?? 'â€”',
        status: record.status,
        checkIn: record.checkIn ?? 'â€”',
        checkOut: record.checkOut ?? 'â€”',
        remarks: record.remarks ?? 'â€”',
      })),
    };
  }
}

export const attendanceService = new AttendanceService();
