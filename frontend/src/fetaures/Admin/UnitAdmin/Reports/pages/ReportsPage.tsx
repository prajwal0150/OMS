import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, FileText, Table2 } from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Section,
  Select,
  Skeleton,
  StatCard,
} from '../../../../../components';
import { toFilterOptions, useScopeOptions } from '../../../../../hooks/useScopeOptions';
import {
  REPORT_LABELS,
  generateReport,
  previewReport,
  type ReportFilters,
} from '../services/reportService';
import { useAuthState } from '../../../../Auth/hooks/useAuth';
import type { ExportFormat, ReportType } from '../../../../../types';

const FORMATS: Array<{ value: ExportFormat; label: string; icon: typeof FileText }> = [
  { value: 'EXCEL', label: 'Excel', icon: FileSpreadsheet },
  { value: 'PDF', label: 'PDF', icon: FileText },
  { value: 'CSV', label: 'CSV', icon: Table2 },
];

const TYPES = Object.keys(REPORT_LABELS) as ReportType[];


/** Renders a single report cell, including array-valued memberships. */
const cellValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '--';
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '--';
  if (typeof value === 'object') return JSON.stringify(value);
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
};

/* The backend returns a normalised report document: a flat summary list plus
   one or more titled tables, each with its own column descriptors. */
interface ReportColumn {
  key: string;
  header: string;
  weight?: number;
  align?: 'left' | 'right' | 'center';
}

interface ReportTable {
  title: string;
  columns: ReportColumn[];
  rows: Array<Record<string, unknown>>;
}

interface ReportSummaryItem {
  label: string;
  value: number | string;
}

interface ReportPayload {
  type: string;
  title: string;
  subtitle?: string;
  scopeLabel?: string;
  generatedBy?: string;
  generatedAt?: string;
  summary?: ReportSummaryItem[];
  tables?: ReportTable[];
  notes?: string;
}

/**
 * Reporting. Every report is computed on the server inside the caller's
 * district / unit / community scope, so a unit administrator cannot widen
 * the population by changing the filters below.
 */
export function ReportsPage() {
  const { can } = useAuthState();
  const { units, communities } = useScopeOptions();
  const [type, setType] = useState<ReportType>('MEMBER');
  const [filters, setFilters] = useState<ReportFilters>({});
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const activeFilters = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')),
    [filters],
  );

  const run = useCallback(async (reportType: ReportType, current: ReportFilters) => {
    setLoading(true);
    setError(null);
    try {
      setData((await previewReport(reportType, current)) as Record<string, unknown>);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to build this report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void run(type, activeFilters);
  }, [type, activeFilters, run]);

  const download = async (format: ExportFormat) => {
    setExporting(format);
    try {
      await generateReport({ type, format, ...activeFilters });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const set = (key: keyof ReportFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  /* The backend returns `{ summary: [...], tables: [{ title, columns, rows }] }`. */
  const report = data as ReportPayload | null;
  const tables = report?.tables ?? [];

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Membership, attendance, committee, event and publishing reports for your scope."
        breadcrumb={[{ label: 'Admin' }, { label: 'Reports' }]}
      />

      <Card padding="sm" className="mb-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            label="Report"
            value={type}
            options={TYPES.map((value) => ({ value, label: REPORT_LABELS[value] }))}
            onChange={(event) => setType(event.target.value as ReportType)}
          />
          <Select
            label="Unit"
            value={filters.unit ?? ''}
            options={toFilterOptions(units)}
            placeholder="All units in my scope"
            onChange={(event) => set('unit', event.target.value)}
          />
          <Select
            label="Community"
            value={filters.community ?? ''}
            options={toFilterOptions(communities)}
            placeholder="All communities in my scope"
            onChange={(event) => set('community', event.target.value)}
          />
          <Input
            label="From"
            type="date"
            value={filters.from ?? ''}
            onChange={(event) => set('from', event.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={filters.to ?? ''}
            onChange={(event) => set('to', event.target.value)}
          />
        </div>

        {can('report.export') && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Export as</span>
            {FORMATS.map((format) => (
              <Button
                key={format.value}
                size="sm"
                variant="outline"
                leftIcon={<format.icon className="h-3.5 w-3.5" />}
                loading={exporting === format.value}
                onClick={() => void download(format.value)}
              >
                {format.label}
              </Button>
            ))}
          </div>
        )}
      </Card>

      {error && (
        <div className="mb-3">
          <ErrorState message={error} onRetry={() => void run(type, activeFilters)} />
        </div>
      )}

      {loading && !report ? (
        <Card>
          <Skeleton className="h-48 w-full" />
        </Card>
      ) : !report ? null : (
        <>
          {report.summary && report.summary.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
              {report.summary.slice(0, 10).map((item) => (
                <StatCard key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          )}

          {report.subtitle && (
            <p className="mb-2 text-sm text-muted">{report.subtitle}</p>
          )}

          {tables.length === 0 ? (
            <Card padding="none">
              <EmptyState
                title="No rows for these filters"
                description="Widen the date range or clear the unit and community filters."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {tables.map((table) => (
                <Section key={table.title} title={table.title}>
                  <Card padding="none">
                    {table.rows.length === 0 ? (
                      <p className="p-6 text-center text-sm text-muted">
                        This section has no rows for the selected filters.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="app-table">
                          <thead>
                            <tr>
                              {table.columns.map((column) => (
                                <th
                                  key={column.key}
                                  scope="col"
                                  className={
                                    column.align === 'right'
                                      ? 'text-right'
                                      : column.align === 'center'
                                        ? 'text-center'
                                        : ''
                                  }
                                >
                                  {column.header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.rows.map((row, rowIndex) => (
                              <tr key={rowIndex}>
                                {table.columns.map((column) => (
                                  <td
                                    key={column.key}
                                    className={column.align === 'right' ? 'text-right' : ''}
                                  >
                                    {cellValue(row[column.key])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </Section>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
            {report.scopeLabel && <span>{report.scopeLabel}</span>}
            {report.generatedBy && <span>Generated by {report.generatedBy}</span>}
            {report.generatedAt && (
              <span>{new Date(report.generatedAt).toLocaleString()}</span>
            )}
            {report.notes && <span>{report.notes}</span>}
          </div>
        </>
      )}
    </div>
  );
}
export default ReportsPage;
