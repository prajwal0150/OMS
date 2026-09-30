import { downloadReport } from '../../../../../services/api/httpClient';
import apiClient, { getList, toQueryParams, unwrap } from '../../../../../services/api/apiClient';
import type { ExportFormat, PaginatedResult, ReportRecord, ReportType } from '../../../../../types';

export interface ReportFilters {
  district?: string;
  unit?: string;
  community?: string;
  committee?: string;
  from?: string;
  to?: string;
  status?: string;
  membershipType?: string;
  gender?: string;
  targetType?: string;
  targetGroup?: string;
  event?: string;
  [key: string]: string | boolean | undefined;
}

export interface GenerateReportInput extends ReportFilters {
  type: ReportType;
  format: ExportFormat;
  saveRecord?: boolean;
}

/** Preview payload (summary + rows) for the on-screen report preview. */
export const previewReport = async (type: ReportType, filters: ReportFilters): Promise<unknown> =>
  unwrap(
    await apiClient.get('/reports/preview', {
      params: toQueryParams({ type, ...filters }),
    }),
  );

/**
 * Streams the generated file (PDF / Excel / CSV) straight to the browser.
 * The backend applies the caller's organizational scope to every report.
 */
export const generateReport = async (input: GenerateReportInput): Promise<void> =>
  downloadReport('/reports/generate', input as unknown as Record<string, unknown>, 'post');

export const fetchReportHistory = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<ReportRecord>> =>
  getList<ReportRecord>('/reports/history', params);

export const fetchSavedReport = async (id: string): Promise<ReportRecord> =>
  unwrap(await apiClient.get<{ data: ReportRecord }>(`/reports/history/${id}`));

export const deleteSavedReport = async (id: string): Promise<void> => {
  await apiClient.delete(`/reports/history/${id}`);
};

export const REPORT_LABELS: Record<ReportType, string> = {
  MEMBER: 'Member Report',
  UNIT: 'Unit Report',
  COMMUNITY: 'Community Report',
  COMMITTEE: 'Committee Report',
  EVENT: 'Event Report',
  ATTENDANCE: 'Attendance Report',
  CONTENT: 'Content Report',
  ANNOUNCEMENT: 'Announcement Report',
  ACTIVITY: 'Activity Report',
};
