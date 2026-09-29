import { CONTENT_STATUS } from '../../constants/enums';
import { buildScopeFilter, isSuperAdmin } from '../../shared/scope';
import type { AuthUser } from '../../types/auth';
import { endOfDay, startOfDay } from '../../utils/date';
import { memberStatsService } from '../members/memberStats.service';
import { attendanceService } from '../attendance/attendance.service';
import { attendanceRepository } from '../attendance/attendance.repository';
import { contentService } from '../content/content.service';
import { contentRepository } from '../content/content.repository';
import { unitRepository } from '../units/unit.repository';
import { communityRepository } from '../communities/community.repository';
import { committeeRepository } from '../committees/committee.repository';
import { eventRepository } from '../events/event.repository';
import { documentRepository } from '../documents/document.repository';
import { mediaRepository } from '../media/media.repository';
import { announcementRepository } from '../announcements/announcement.repository';
import { ReportRecordModel } from './report.model';

/**
 * Scope aware analytics for the dashboards and the unit/community summary
 * panels. All aggregations run in MongoDB — nothing is filtered in memory.
 */
export class ReportAnalyticsService {
  async dashboard(user: AuthUser, query: Record<string, unknown> = {}) {
    const scope = buildScopeFilter(user, {
      unit: typeof query.unit === 'string' ? query.unit : undefined,
      community: typeof query.community === 'string' ? query.community : undefined,
    });
    const today = startOfDay(new Date());

    const [
      members,
      membersByUnit,
      membersByCommunity,
      monthlyGrowth,
      attendanceTrend,
      eventParticipation,
      contentActivity,
      unitsTotal,
      communitiesTotal,
      committeesTotal,
      contentPublished,
      contentPending,
      contentDraft,
      announcementsTotal,
      documentsTotal,
      mediaTotal,
      eventsTotal,
      upcomingEvents,
      todayAttendance,
    ] = await Promise.all([
      memberStatsService.statusSummary(user),
      memberStatsService.byUnit(user),
      memberStatsService.byCommunity(user),
      memberStatsService.growth(user, 12),
      attendanceService.monthlyTrend(user, 12),
      attendanceService.eventParticipation(user, 6),
      contentService.monthly(user, 12),
      unitRepository.count(null, scope),
      communityRepository.count(null, scope),
      committeeRepository.count(null, scope),
      contentRepository.count(user, { status: CONTENT_STATUS.PUBLISHED }),
      contentRepository.count(user, { status: CONTENT_STATUS.PENDING_REVIEW }),
      contentRepository.count(user, { status: CONTENT_STATUS.DRAFT }),
      announcementRepository.count(null, scope),
      documentRepository.count(null, scope),
      mediaRepository.count(null, scope),
      eventRepository.count(null, scope),
      eventRepository.upcoming(scope, 6),
      attendanceService.summary(user, {
        from: today.toISOString(),
        to: endOfDay(new Date()).toISOString(),
      }),
    ]);

    return {
      members,
      totals: {
        units: unitsTotal,
        communities: communitiesTotal,
        committees: committeesTotal,
        events: eventsTotal,
        upcomingEvents: upcomingEvents.length,
        announcements: announcementsTotal,
        documents: documentsTotal,
        media: mediaTotal,
        contentPublished,
        contentPending,
        contentDraft,
      },
      todayAttendance,
      upcomingEvents,
      charts: {
        membersByUnit,
        membersByCommunity,
        monthlyGrowth,
        attendanceTrend,
        eventParticipation,
        contentActivity,
      },
    };
  }

  /** Summary panel for a single unit. */
  async unitSummary(user: AuthUser, unitId: string) {
    const unit = await unitRepository.findByIdScoped(unitId, user, 'Unit');
    const scope = { unit: unit._id };
    const [members, communities, committees, events, attendanceRecords, content, upcomingEvents, attendance] =
      await Promise.all([
        memberStatsService.statusSummary(user, { unit: unitId }),
        communityRepository.count(null, scope),
        committeeRepository.count(null, scope),
        eventRepository.count(null, scope),
        attendanceRepository.count(null, scope),
        contentRepository.count(user, scope),
        eventRepository.upcoming(scope, 5),
        attendanceService.summary(user, { unit: unitId }),
      ]);

    return {
      unit,
      members,
      communities,
      committees,
      events,
      attendanceRecords,
      content,
      attendance,
      upcomingEvents,
    };
  }

  /** Summary panel for a single community. */
  async communitySummary(user: AuthUser, communityId: string) {
    const community = await communityRepository.findByIdScoped(communityId, user, 'Community');
    const scope = { community: community._id };
    const [members, committees, events, content, attendanceRecords, upcomingEvents, attendance] =
      await Promise.all([
        memberStatsService.statusSummary(user, { community: communityId }),
        committeeRepository.count(null, scope),
        eventRepository.count(null, scope),
        contentRepository.count(user, scope),
        attendanceRepository.count(null, scope),
        eventRepository.upcoming(scope, 5),
        attendanceService.summary(user, { community: communityId }),
      ]);

    return {
      community,
      members,
      committees,
      events,
      content,
      attendanceRecords,
      attendance,
      upcomingEvents,
    };
  }

  /** District level summary used by district administration screens. */
  async districtSummary(user: AuthUser, districtId?: string) {
    const effectiveDistrictId = isSuperAdmin(user) ? districtId : (user.district ?? districtId);
    const filter = effectiveDistrictId ? { district: effectiveDistrictId } : {};
    const [members, units, communities, committees, events, content, committeesByLevel, eventsByStatus, attendance, unitsByMembers, communitiesByMembers] =
      await Promise.all([
        memberStatsService.statusSummary(user),
        unitRepository.count(null, filter),
        communityRepository.count(null, filter),
        committeeRepository.count(null, filter),
        eventRepository.count(null, filter),
        contentRepository.count(user, {}),
        committeeRepository.countByLevels(filter),
        eventRepository.countByStatus(filter),
        attendanceService.summary(user, {}),
        memberStatsService.byUnit(user),
        memberStatsService.byCommunity(user),
      ]);

    return {
      members,
      totals: { units, communities, committees, events, content },
      committeesByLevel,
      eventsByStatus,
      attendance,
      unitsByMembers,
      communitiesByMembers,
    };
  }

  /** Report generation history for the reports hub. */
  async recentReports(user: AuthUser, limit = 20) {
    return ReportRecordModel.find(buildScopeFilter(user))
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  /** Unit breakdown wrapper. */
  async unitBreakdown(user: AuthUser, query: Record<string, unknown> = {}) {
    return memberStatsService.byUnit(user, query);
  }

  /** Community breakdown wrapper. */
  async communityBreakdown(user: AuthUser, query: Record<string, unknown> = {}) {
    return memberStatsService.byCommunity(user, query);
  }

  /** Membership growth trend over n months. */
  async membershipTrend(user: AuthUser, months = 12) {
    return memberStatsService.growth(user, months);
  }

}

export const reportAnalyticsService = new ReportAnalyticsService();
