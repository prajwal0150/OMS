import apiClient, { getList, toQueryParams, unwrap } from '../../../../../services/api/apiClient';
import type { AuditLogEntry, PaginatedResult } from '../../../../../types';

export const fetchAuditLogs = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<AuditLogEntry>> =>
  getList<AuditLogEntry>('/audit-logs', params);

export const fetchAuditLogById = async (id: string): Promise<AuditLogEntry> =>
  unwrap(await apiClient.get<{ data: AuditLogEntry }>(`/audit-logs/${id}`));

export const fetchAuditSummary = async (
  params?: Record<string, unknown>,
): Promise<{ total: number; actions: Array<{ _id: string; count: number }> }> =>
  unwrap(
    await apiClient.get<{ data: { total: number; actions: Array<{ _id: string; count: number }> } }>(
      '/audit-logs/summary',
      { params: toQueryParams(params) },
    ),
  );

/** Entities that can be filtered in the audit log viewer. */
export const AUDIT_ENTITIES = [
  'Auth',
  'Organization',
  'District',
  'Unit',
  'Community',
  'Committee',
  'Member',
  'MemberAccount',
  'Administrator',
  'Event',
  'Attendance',
  'Content',
  'Announcement',
  'Media',
  'Document',
  'Report',
  'Role',
] as const;
