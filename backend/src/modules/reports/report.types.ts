import { REPORT_TYPE } from '../../constants/enums';
import type { ReportType } from '../../constants/enums';

export interface ReportFilter {
  label: string;
  value: string;
}

export interface ReportSummaryItem {
  label: string;
  value: string | number;
}

export interface ReportTable {
  title?: string;
  columns: Array<{ key: string; header: string; weight?: number; align?: 'left' | 'right' | 'center' }>;
  rows: Array<Record<string, string | number>>;
}

/** Normalised report document consumed by the PDF, Excel and CSV renderers. */
export interface ReportPayload {
  type: ReportType;
  title: string;
  subtitle?: string;
  scopeLabel: string;
  filters: ReportFilter[];
  summary: ReportSummaryItem[];
  tables: ReportTable[];
  notes?: string;
  generatedAt: Date;
  generatedBy: string;
}

export interface ReportHistoryDocument {
  type: ReportType;
  format: string;
  filters: Record<string, unknown>;
  generatedBy?: string;
  rowCount: number;
}

export const REPORT_LABELS: Record<ReportType, string> = {
  MEMBER: 'Member report',
  UNIT: 'Unit report',
  COMMUNITY: 'Community report',
  COMMITTEE: 'Committee report',
  EVENT: 'Event report',
  ATTENDANCE: 'Attendance report',
  CONTENT: 'Content report',
  ANNOUNCEMENT: 'Announcement report',
  ACTIVITY: 'Activity report',
};

export const isReportType = (value: string): value is ReportType =>
  (Object.values(REPORT_TYPE) as string[]).includes(value);
