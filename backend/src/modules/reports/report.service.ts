import type { Request } from 'express';
import { AUDIT_ACTION, REPORT_TYPE } from '../../constants/enums';
import type { ExportFormat, ReportType } from '../../constants/enums';
import { isSuperAdmin } from '../../shared/scope';
import type { AuthUser } from '../../types/auth';
import { ApiError } from '../../utils/ApiError';
import { formatDate } from '../../utils/date';
import { attendanceService } from '../attendance/attendance.service';
import { memberStatsService } from '../members/memberStats.service';
import { contentService } from '../content/content.service';
import { announcementService } from '../announcements/announcement.service';
import { unitRepository } from '../units/unit.repository';
import { communityRepository } from '../communities/community.repository';
import { committeeRepository } from '../committees/committee.repository';
import { eventRepository } from '../events/event.repository';
import { districtRepository } from '../district/district.repository';
import { auditLogService } from '../auditLogs/auditLog.service';
import { reportExportService } from './report.export.service';
import { ReportRecordModel } from './report.model';
import { REPORT_LABELS } from './report.types';
import type { ReportPayload } from './report.types';
import { buildScopeFilter } from '../../shared/scope';
import { buildDateRange, combineFilters, readEnum } from '../../shared/queryFilters';
import { buildPaginationMeta, parsePagination } from '../../utils/pagination';
import { EXPORT_FORMAT } from '../../constants/enums';


export interface ReportBuildContext {
  type: ReportType;
  scopeLabel: string;
  filters: Array<{ label: string; value: string }>;
  generatedBy: string;
  title: string;
}

export class ReportService {
  /** Builds the normalised report document for a report type. */
  async build(
    user: AuthUser,
    type: ReportType,
    query: Record<string, unknown>,
  ): Promise<ReportPayload> {
    const [scopeLabel, districtName, unitName, communityName] = await Promise.all([
      this.scopeLabel(user),
      this.nameOf(districtRepository, query.district),
      this.nameOf(unitRepository, query.unit),
      this.nameOf(communityRepository, query.community),
    ]);

    const filters = this.buildFilters(query, { districtName, unitName, communityName });
    const generatedBy = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
    const context: ReportBuildContext = {
      type,
      scopeLabel,
      filters,
      generatedBy,
      title: REPORT_LABELS[type],
    };

    switch (type) {
      case REPORT_TYPE.MEMBER:
        return this.memberPayload(user, query, context);
      case REPORT_TYPE.ATTENDANCE:
        return this.attendancePayload(user, query, context);
      case REPORT_TYPE.UNIT:
        return this.unitPayload(user, query, context);
      case REPORT_TYPE.COMMUNITY:
        return this.communityPayload(user, query, context);
      case REPORT_TYPE.COMMITTEE:
        return this.committeePayload(user, query, context);
      case REPORT_TYPE.EVENT:
        return this.eventPayload(user, query, context);
      case REPORT_TYPE.CONTENT:
        return this.contentPayload(user, query, context);
      case REPORT_TYPE.ANNOUNCEMENT:
        return this.announcementPayload(user, query, context);
      case REPORT_TYPE.ACTIVITY:
        return this.activityPayload(user, query, context);
      default:
        throw ApiError.badRequest('Unsupported report type');
    }
  }

  /** Generates and renders a report, then records it in the report history. */
  async exportReport(
    user: AuthUser,
    type: ReportType,
    format: ExportFormat,
    query: Record<string, unknown>,
    req?: Request,
  ) {
    const payload = await this.build(user, type, query);
    const rendered = await reportExportService.render(format, payload);
    const rowCount = payload.tables.reduce((sum, table) => sum + table.rows.length, 0);

    await ReportRecordModel.create({
      type,
      format,
      title: payload.title,
      filters: query,
      rowCount,
      district: user.district ?? undefined,
      unit: user.unit ?? undefined,
      community: user.community ?? undefined,
      generatedBy: user.id,
      generatedByName: payload.generatedBy,
    });

    await auditLogService.record({
      action: AUDIT_ACTION.EXPORT,
      entity: 'Report',
      entityId: type,
      description: `${payload.title} exported as ${format} (${rowCount} rows)`,
      user,
      request: req,
    });

    return { payload, rendered, rowCount };
  }
  /** Generates the binary output for controller downloads. */
  async generate(
    user: AuthUser,
    type: ReportType,
    format: ExportFormat,
    filters: Record<string, unknown>,
    options: { saveRecord?: boolean; req?: Request } = {},
  ) {
    const payload = await this.build(user, type, filters);
    const rendered = await reportExportService.render(format, payload);
    const rowCount = payload.tables.reduce((sum, table) => sum + table.rows.length, 0);

    if (options.saveRecord !== false) {
      await ReportRecordModel.create({
        type,
        format,
        title: payload.title,
        filters,
        rowCount,
        district: user.district ?? undefined,
        unit: user.unit ?? undefined,
        community: user.community ?? undefined,
        generatedBy: user.id,
        generatedByName: payload.generatedBy,
      });

      await auditLogService.record({
        action: AUDIT_ACTION.EXPORT,
        entity: 'Report',
        entityId: type,
        description: `${payload.title} exported as ${format} (${rowCount} rows)`,
        user,
        request: options.req,
      });
    }

    return {
      buffer: rendered.buffer,
      filename: rendered.fileName,
      mimeType: rendered.contentType,
      rowCount,
    };
  }

  /** Preview payload without exporting to a file. */
  async preview(user: AuthUser, type: ReportType, query: Record<string, unknown>): Promise<ReportPayload> {
    return this.build(user, type, query);
  }

  /** Lists saved report history scoped to caller. */
  async history(user: AuthUser, query: Record<string, unknown>) {
    const { page, limit, skip, sort } = parsePagination(query, {
      allowedSortFields: ['createdAt', 'type', 'format', 'rowCount', 'title'],
      defaultSort: 'createdAt',
    });

    const type = readEnum(query.type, Object.values(REPORT_TYPE));
    const format = readEnum(query.format, Object.values(EXPORT_FORMAT));
    const dateRange = buildDateRange(query.from, query.to, { endOfDay: true });

    const filter = combineFilters(
      buildScopeFilter(user),
      type ? { type } : {},
      format ? { format } : {},
      typeof query.unit === 'string' && query.unit ? { unit: query.unit } : {},
      typeof query.community === 'string' && query.community ? { community: query.community } : {},
      Object.keys(dateRange).length > 0 ? { createdAt: dateRange } : {},
    );

    const [items, total] = await Promise.all([
      ReportRecordModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      ReportRecordModel.countDocuments(filter).exec(),
    ]);

    return { items, meta: buildPaginationMeta(total, page, limit) };
  }

  /** Retrieves a saved report metadata record. */
  async getSaved(user: AuthUser, id: string) {
    const record = await ReportRecordModel.findOne({
      _id: id,
      ...buildScopeFilter(user),
    })
      .lean()
      .exec();

    if (!record) {
      throw ApiError.notFound('Report record not found or outside your scope');
    }
    return record;
  }

  /** Deletes a saved report record from history. */
  async deleteSaved(user: AuthUser, id: string): Promise<void> {
    const record = await ReportRecordModel.findOne({
      _id: id,
      ...buildScopeFilter(user),
    }).exec();

    if (!record) {
      throw ApiError.notFound('Report record not found or outside your scope');
    }

    await record.deleteOne();

    await auditLogService.record({
      action: AUDIT_ACTION.DELETE,
      entity: 'ReportRecord',
      entityId: id,
      description: `Report history entry ${record.title} deleted`,
      user,
    });
  }


  private async scopeLabel(user: AuthUser): Promise<string> {
    if (isSuperAdmin(user)) return 'Organization wide (all districts)';
    const district = user.district ? await districtRepository.findById(user.district) : null;
    const unit = user.unit ? await unitRepository.findById(user.unit) : null;
    const community = user.community ? await communityRepository.findById(user.community) : null;
    return (
      [district?.name, unit?.name, community?.name].filter(Boolean).join(' › ') || 'Assigned scope'
    );
  }

  private async nameOf(
    repository: { findById: (id: string) => Promise<{ name?: string } | null> },
    value: unknown,
  ): Promise<string | undefined> {
    if (typeof value !== 'string' || value.length === 0) return undefined;
    const record = await repository.findById(value).catch(() => null);
    return record?.name;
  }

  private buildFilters(
    query: Record<string, unknown>,
    names: { districtName?: string; unitName?: string; communityName?: string },
  ): Array<{ label: string; value: string }> {
    const mapped: Record<string, string | undefined> = {
      District: names.districtName,
      Unit: names.unitName,
      Community: names.communityName,
      Status: typeof query.status === 'string' ? query.status : undefined,
      Gender: typeof query.gender === 'string' ? query.gender : undefined,
      'Membership type':
        typeof query.membershipType === 'string' ? query.membershipType : undefined,
      Event: typeof query.event === 'string' ? query.event : undefined,
      'Content type': typeof query.contentType === 'string' ? query.contentType : undefined,
      Category: typeof query.category === 'string' ? query.category : undefined,
      'Attendance status':
        typeof query.attendanceStatus === 'string' ? query.attendanceStatus : undefined,
      From: typeof query.from === 'string' ? formatDate(query.from) : undefined,
      To: typeof query.to === 'string' ? formatDate(query.to) : undefined,
    };

    const filters: Array<{ label: string; value: string }> = [];
    Object.entries(mapped).forEach(([label, value]) => {
      if (value) filters.push({ label, value: value.replace(/_/g, ' ') });
    });
    return filters;
  }

  /* ---- Member report ---- */
  private async memberPayload(
    user: AuthUser,
    query: Record<string, unknown>,
    context: ReportBuildContext,
  ): Promise<ReportPayload> {
    const report = await memberStatsService.report(user, query);
    return this.payload(context, {
      subtitle: `${report.summary.total} member(s) matching the selected filters`,
      summary: [
        { label: 'Total members', value: report.summary.total },
        { label: 'Active', value: report.summary.active },
        { label: 'Pending', value: report.summary.pending },
        { label: 'Inactive', value: report.summary.inactive },
        { label: 'Suspended', value: report.summary.suspended },
      ],
      tables: [
        {
          title: 'Members by unit',
          columns: [
            { key: 'label', header: 'Unit', weight: 3 },
            { key: 'count', header: 'Members', weight: 1, align: 'right' },
          ],
          rows: report.byUnit.map((row) => ({ label: row.label, count: row.count })),
        },
        {
          title: 'Members by community',
          columns: [
            { key: 'label', header: 'Community', weight: 3 },
            { key: 'count', header: 'Members', weight: 1, align: 'right' },
          ],
          rows: report.byCommunity.map((row) => ({ label: row.label, count: row.count })),
        },
        {
          title: 'Member register',
          columns: [
            { key: 'memberId', header: 'Member ID', weight: 1.2 },
            { key: 'name', header: 'Name', weight: 2 },
            { key: 'gender', header: 'Gender', weight: 0.8 },
            { key: 'phone', header: 'Phone', weight: 1.2 },
            { key: 'unit', header: 'Unit', weight: 1.2 },
            { key: 'communities', header: 'Communities', weight: 1.6 },
            { key: 'membershipType', header: 'Type', weight: 1 },
            { key: 'status', header: 'Status', weight: 1 },
            { key: 'joinedDate', header: 'Joined', weight: 1.1 },
          ],
          rows: report.rows as unknown as Array<Record<string, string | number>>,
        },
      ],
      notes: 'Committee and attendance details are available in their dedicated reports.',
    });
  }

  /* ---- Attendance report ---- */
  private async attendancePayload(
    user: AuthUser,
    query: Record<string, unknown>,
    context: ReportBuildContext,
  ): Promise<ReportPayload> {
    const report = await attendanceService.report(user, query);
    return this.payload(context, {
      subtitle: `${report.summary.total} attendance record(s) in the selected period`,
      summary: [
        { label: 'Total records', value: report.summary.total },
        { label: 'Present', value: report.summary.present },
        { label: 'Late', value: report.summary.late },
        { label: 'Absent', value: report.summary.absent },
        { label: 'Excused', value: report.summary.excused },
        { label: 'Attendance %', value: `${report.summary.attendancePercentage}%` },
      ],
      tables: [
        {
          title: 'Attendance by event',
          columns: [
            { key: 'title', header: 'Event', weight: 3 },
            { key: 'present', header: 'Present', weight: 1, align: 'right' },
            { key: 'total', header: 'Marked', weight: 1, align: 'right' },
          ],
          rows: report.perEvent.map((row) => ({
            title: row.title,
            present: row.present,
            total: row.total,
          })),
        },
        {
          title: 'Attendance register',
          columns: [
            { key: 'date', header: 'Date', weight: 1 },
            { key: 'event', header: 'Event', weight: 2.2 },
            { key: 'memberId', header: 'Member ID', weight: 1.2 },
            { key: 'member', header: 'Member', weight: 1.8 },
            { key: 'unit', header: 'Unit', weight: 1.2 },
            { key: 'community', header: 'Community', weight: 1.3 },
            { key: 'status', header: 'Status', weight: 1 },
            { key: 'remarks', header: 'Remarks', weight: 1.6 },
          ],
          rows: report.rows as unknown as Array<Record<string, string | number>>,
        },
      ],
    });
  }

  /* ---- Unit report ---- */
  private async unitPayload(
    user: AuthUser,
    query: Record<string, unknown>,
    context: ReportBuildContext,
  ): Promise<ReportPayload> {
    const units = await unitRepository.list(user, { ...query, limit: 200 }, {});
    const rows: Array<Record<string, string | number>> = [];
    let totalMembers = 0;

    for (const unit of units.items) {
      const [members, communities, committees, events, content] = await Promise.all([
        memberStatsService.statusSummary(user, { unit: String(unit._id) }),
        communityRepository.count(null, { unit: unit._id }),
        committeeRepository.count(null, { unit: unit._id }),
        eventRepository.count(null, { unit: unit._id }),
        contentService.list(user, { unit: String(unit._id), limit: 1 }),
      ]);
      totalMembers += members.total;
      rows.push({
        unit: unit.name,
        code: unit.code,
        location: unit.location ?? '—',
        members: members.total,
        activeMembers: members.active,
        communities,
        committees,
        events,
        content: content.meta.total,
        status: unit.status,
      });
    }

    return this.payload(context, {
      subtitle: `${units.meta.total} unit(s) in scope`,
      summary: [
        { label: 'Units', value: units.meta.total },
        { label: 'Members', value: totalMembers },
        { label: 'Communities', value: await communityRepository.count(null, {}) },
        { label: 'Committees', value: await committeeRepository.count(null, {}) },
      ],
      tables: [
        {
          title: 'Unit overview',
          columns: [
            { key: 'unit', header: 'Unit', weight: 2 },
            { key: 'code', header: 'Code', weight: 1 },
            { key: 'location', header: 'Location', weight: 1.6 },
            { key: 'members', header: 'Members', weight: 1, align: 'right' },
            { key: 'activeMembers', header: 'Active', weight: 1, align: 'right' },
            { key: 'communities', header: 'Communities', weight: 1.2, align: 'right' },
            { key: 'committees', header: 'Committees', weight: 1.2, align: 'right' },
            { key: 'events', header: 'Events', weight: 1, align: 'right' },
            { key: 'content', header: 'Content', weight: 1, align: 'right' },
            { key: 'status', header: 'Status', weight: 1 },
          ],
          rows,
        },
      ],
      notes: 'Figures are calculated live from the database for the selected scope.',
    });
  }

  /* ---- Community report ---- */
  private async communityPayload(
    user: AuthUser,
    query: Record<string, unknown>,
    context: ReportBuildContext,
  ): Promise<ReportPayload> {
    const communities = await communityRepository.list(user, { ...query, limit: 200 }, {});
    const rows: Array<Record<string, string | number>> = [];

    for (const community of communities.items) {
      const [members, committees, events, content, attendance] = await Promise.all([
        memberStatsService.statusSummary(user, { community: String(community._id) }),
        committeeRepository.count(null, { community: community._id }),
        eventRepository.count(null, { community: community._id }),
        contentService.list(user, { community: String(community._id), limit: 1 }),
        attendanceService.summary(user, { community: String(community._id) }),
      ]);
      rows.push({
        community: community.name,
        code: community.code,
        targetGroup: community.targetGroup,
        members: members.total,
        activeMembers: members.active,
        committees,
        events,
        content: content.meta.total,
        attendance: `${attendance.attendancePercentage}%`,
        status: community.status,
      });
    }

    return this.payload(context, {
      subtitle: `${communities.meta.total} community(ies) in scope`,
      summary: [
        { label: 'Communities', value: communities.meta.total },
        { label: 'Members', value: await memberStatsService.statusSummary(user).then((s) => s.total) },
      ],
      tables: [
        {
          title: 'Community overview',
          columns: [
            { key: 'community', header: 'Community', weight: 2 },
            { key: 'code', header: 'Code', weight: 1 },
            { key: 'targetGroup', header: 'Target group', weight: 1.4 },
            { key: 'members', header: 'Members', weight: 1, align: 'right' },
            { key: 'activeMembers', header: 'Active', weight: 1, align: 'right' },
            { key: 'committees', header: 'Committees', weight: 1.2, align: 'right' },
            { key: 'events', header: 'Events', weight: 1, align: 'right' },
            { key: 'content', header: 'Content', weight: 1, align: 'right' },
            { key: 'attendance', header: 'Attendance', weight: 1.2, align: 'right' },
            { key: 'status', header: 'Status', weight: 1 },
          ],
          rows,
        },
      ],
    });
  }
  /* ---- Committee report ---- */
  private async committeePayload(
    user: AuthUser,
    query: Record<string, unknown>,
    context: ReportBuildContext,
  ): Promise<ReportPayload> {
    const committees = await committeeRepository.list(user, { ...query, limit: 200 }, {});
    const rows = committees.items.map((committee) => ({
      name: committee.name,
      level: committee.level,
      unit: (committee.unit as unknown as { name?: string } | undefined)?.name ?? '—',
      community:
        (committee.community as unknown as { name?: string } | undefined)?.name ?? '—',
      positions: committee.positions?.length ?? 0,
      activePositions: (committee.positions ?? []).filter((entry) => entry.active).length,
      startDate: committee.startDate
        ? new Date(committee.startDate).toISOString().slice(0, 10)
        : '—',
      status: committee.status,
    }));

    return this.payload(context, {
      subtitle: `${committees.meta.total} committee(s) in scope`,
      summary: [
        { label: 'Committees', value: committees.meta.total },
        {
          label: 'Total positions',
          value: rows.reduce((sum, row) => sum + row.positions, 0),
        },
        {
          label: 'Filled positions',
          value: rows.reduce((sum, row) => sum + row.activePositions, 0),
        },
      ],
      tables: [
        {
          title: 'Committee register',
          columns: [
            { key: 'name', header: 'Committee', weight: 2.4 },
            { key: 'level', header: 'Level', weight: 1 },
            { key: 'unit', header: 'Unit', weight: 1.6 },
            { key: 'community', header: 'Community', weight: 1.6 },
            { key: 'positions', header: 'Positions', weight: 1, align: 'right' },
            { key: 'activePositions', header: 'Filled', weight: 1, align: 'right' },
            { key: 'startDate', header: 'Start', weight: 1 },
            { key: 'status', header: 'Status', weight: 1 },
          ],
          rows,
        },
      ],
    });
  }

  /* ---- Event report ---- */
  private async eventPayload(
    user: AuthUser,
    query: Record<string, unknown>,
    context: ReportBuildContext,
  ): Promise<ReportPayload> {
    const events = await eventRepository.list(user, { ...query, limit: 300 }, {});
    const byStatus = await eventRepository.countByStatus(
      eventRepository.buildFilter(user, {}) as Record<string, unknown>,
    );
    const statusOf = (status: string) =>
      byStatus.find((row) => row.key === status)?.count ?? 0;

    return this.payload(context, {
      subtitle: `${events.meta.total} event(s) in scope`,
      summary: [
        { label: 'Events', value: events.meta.total },
        { label: 'Scheduled', value: statusOf('SCHEDULED') },
        { label: 'Completed', value: statusOf('COMPLETED') },
        { label: 'Cancelled', value: statusOf('CANCELLED') },
      ],
      tables: [
        {
          title: 'Event register',
          columns: [
            { key: 'title', header: 'Event', weight: 2.6 },
            { key: 'type', header: 'Type', weight: 1.4 },
            { key: 'level', header: 'Level', weight: 1 },
            { key: 'unit', header: 'Unit', weight: 1.4 },
            { key: 'community', header: 'Community', weight: 1.4 },
            { key: 'startDate', header: 'Start', weight: 1.1 },
            { key: 'location', header: 'Location', weight: 1.6 },
            { key: 'status', header: 'Status', weight: 1 },
          ],
          rows: events.items.map((event) => ({
            title: event.title,
            type: event.type,
            level: event.level,
            unit: (event.unit as unknown as { name?: string } | undefined)?.name ?? '—',
            community:
              (event.community as unknown as { name?: string } | undefined)?.name ?? '—',
            startDate: new Date(event.startDate).toISOString().slice(0, 10),
            location: event.location ?? '—',
            status: event.status,
          })),
        },
      ],
    });
  }

  /* ---- Content report ---- */
  private async contentPayload(
    user: AuthUser,
    query: Record<string, unknown>,
    context: ReportBuildContext,
  ): Promise<ReportPayload> {
    const report = await contentService.report(user, query);
    const published = report.summary.find((row) => row.key === 'PUBLISHED')?.count ?? 0;
    const pending = report.summary.find((row) => row.key === 'PENDING_REVIEW')?.count ?? 0;

    return this.payload(context, {
      subtitle: `${report.rows.length} content item(s) in scope`,
      summary: [
        { label: 'Items listed', value: report.rows.length },
        { label: 'Published', value: published },
        { label: 'Pending review', value: pending },
        {
          label: 'Total views',
          value: report.rows.reduce((sum, row) => sum + Number(row.views ?? 0), 0),
        },
      ],
      tables: [
        {
          title: 'Content by status',
          columns: [
            { key: 'status', header: 'Status', weight: 2 },
            { key: 'count', header: 'Items', weight: 1, align: 'right' },
          ],
          rows: report.summary.map((row) => ({
            status: row.key.replace(/_/g, ' '),
            count: row.count,
          })),
        },
        {
          title: 'Content register',
          columns: [
            { key: 'title', header: 'Title', weight: 2.6 },
            { key: 'type', header: 'Type', weight: 1.4 },
            { key: 'status', header: 'Status', weight: 1.2 },
            { key: 'visibility', header: 'Visibility', weight: 1.3 },
            { key: 'publishedBy', header: 'Published by', weight: 1.6 },
            { key: 'district', header: 'District', weight: 1.2 },
            { key: 'unit', header: 'Unit', weight: 1.2 },
            { key: 'community', header: 'Community', weight: 1.3 },
            { key: 'date', header: 'Date', weight: 1.1 },
            { key: 'views', header: 'Views', weight: 0.8, align: 'right' },
          ],
          rows: report.rows as unknown as Array<Record<string, string | number>>,
        },
      ],
    });
  }

  /* ---- Announcement report ---- */
  private async announcementPayload(
    user: AuthUser,
    query: Record<string, unknown>,
    context: ReportBuildContext,
  ): Promise<ReportPayload> {
    const report = await announcementService.report(user, query);
    return this.payload(context, {
      subtitle: `${report.rows.length} announcement(s) in scope`,
      summary: [
        { label: 'Announcements', value: report.rows.length },
        {
          label: 'Public',
          value: report.rows.filter((row) => row.audience === 'Public').length,
        },
        {
          label: 'Members only',
          value: report.rows.filter((row) => row.audience === 'Members').length,
        },
      ],
      tables: [
        {
          title: 'Announcement register',
          columns: [
            { key: 'title', header: 'Title', weight: 2.8 },
            { key: 'targetType', header: 'Target', weight: 1.6 },
            { key: 'unit', header: 'Unit', weight: 1.4 },
            { key: 'community', header: 'Community', weight: 1.4 },
            { key: 'publishDate', header: 'Published', weight: 1.2 },
            { key: 'expiryDate', header: 'Expires', weight: 1.2 },
            { key: 'audience', header: 'Audience', weight: 1.1 },
            { key: 'status', header: 'Status', weight: 1 },
          ],
          rows: report.rows as unknown as Array<Record<string, string | number>>,
        },
      ],
    });
  }

  /* ---- Activity report ---- */
  private async activityPayload(
    user: AuthUser,
    query: Record<string, unknown>,
    context: ReportBuildContext,
  ): Promise<ReportPayload> {
    const [content, events, announcements] = await Promise.all([
      contentService.report(user, { ...query, limit: 150 }),
      eventRepository.list(user, { ...query, limit: 150 }, {}),
      announcementService.report(user, { ...query, limit: 150 }),
    ]);

    return this.payload(context, {
      subtitle: 'Combined activity feed (content, events and announcements)',
      summary: [
        { label: 'Content items', value: content.rows.length },
        { label: 'Events', value: events.meta.total },
        { label: 'Announcements', value: announcements.rows.length },
      ],
      tables: [
        {
          title: 'Activities and updates',
          columns: [
            { key: 'title', header: 'Activity', weight: 2.6 },
            { key: 'type', header: 'Type', weight: 1.4 },
            { key: 'scope', header: 'Scope', weight: 1.8 },
            { key: 'date', header: 'Date', weight: 1.1 },
            { key: 'status', header: 'Status', weight: 1.2 },
          ],
          rows: content.rows.map((row) => ({
            title: row.title,
            type: row.type,
            scope: [row.unit, row.community].filter((value) => value && value !== '—').join(' / ') || 'District',
            date: row.date,
            status: row.status,
          })),
        },
        {
          title: 'Events calendar',
          columns: [
            { key: 'title', header: 'Event', weight: 2.6 },
            { key: 'type', header: 'Type', weight: 1.4 },
            { key: 'startDate', header: 'Date', weight: 1.1 },
            { key: 'location', header: 'Location', weight: 1.6 },
            { key: 'status', header: 'Status', weight: 1.2 },
          ],
          rows: events.items.map((event) => ({
            title: event.title,
            type: event.type,
            startDate: new Date(event.startDate).toISOString().slice(0, 10),
            location: event.location ?? '—',
            status: event.status,
          })),
        },
      ],
    });
  }
  /* ---- Helper for payload construction ---- */
  private payload(
    context: ReportBuildContext,
    data: Omit<ReportPayload, 'type' | 'title' | 'scopeLabel' | 'filters' | 'generatedBy' | 'generatedAt'>,
  ): ReportPayload {
    return {
      type: context.type,
      title: context.title,
      scopeLabel: context.scopeLabel,
      filters: context.filters,
      generatedBy: context.generatedBy,
      generatedAt: new Date(),
      ...data,
    };
  }
}

export const reportService = new ReportService();
