import { buildCsv, buildExcelWorkbook } from '../../utils/exporters';
import { buildReportPdf } from '../../utils/pdf/ReportPdfBuilder';
import { organizationRepository } from '../organization/organization.repository';
import type { ReportPayload } from './report.types';

export type ExportFormat = 'PDF' | 'EXCEL' | 'CSV' | 'JSON';

export interface RenderedExport {
  buffer: Buffer | string;
  contentType: string;
  fileName: string;
}

const fileBaseName = (payload: ReportPayload): string =>
  `${payload.type.toLowerCase()}-report-${payload.generatedAt.toISOString().slice(0, 10)}`;

/**
 * Renders a normalised report payload into the requested format.
 * PDF is produced server side with organization branding, filters, summary
 * cards, paginated tables and page numbers.
 */
export class ReportExportService {
  private async logoPath(): Promise<string | null> {
    const organization = await organizationRepository.getSingleton();
    return organization?.logo ?? null;
  }

  async render(format: ExportFormat, payload: ReportPayload): Promise<RenderedExport> {
    switch (format) {
      case 'PDF':
        return this.toPdf(payload);
      case 'EXCEL':
        return this.toExcel(payload);
      case 'CSV':
        return this.toCsv(payload);
      default:
        return {
          buffer: JSON.stringify(payload, null, 2),
          contentType: 'application/json',
          fileName: `${fileBaseName(payload)}.json`,
        };
    }
  }

  private async toPdf(payload: ReportPayload): Promise<RenderedExport> {
    const buffer = await buildReportPdf({
      title: payload.title,
      subtitle: payload.subtitle,
      logoPath: await this.logoPath(),
      generatedBy: payload.generatedBy,
      generatedAt: payload.generatedAt,
      filters: payload.filters,
      summary: payload.summary,
      tables: payload.tables,
      notes: payload.notes,
      orientation: payload.tables.some((table) => table.columns.length > 6)
        ? 'landscape'
        : 'portrait',
    });
    return {
      buffer,
      contentType: 'application/pdf',
      fileName: `${fileBaseName(payload)}.pdf`,
    };
  }

  private async toExcel(payload: ReportPayload): Promise<RenderedExport> {
    const sheets = payload.tables.map((table, index) => ({
      name: table.title ?? `Data ${index + 1}`,
      columns: table.columns.map((column) => ({ key: column.key, header: column.header })),
      rows: table.rows,
    }));

    const summarySheet = {
      name: 'Summary',
      columns: [
        { key: 'label', header: 'Metric' },
        { key: 'value', header: 'Value' },
      ],
      rows: [
        ...payload.filters.map((filter) => ({ label: filter.label, value: filter.value })),
        ...payload.summary.map((item) => ({ label: item.label, value: item.value })),
      ],
    };

    const buffer = await buildExcelWorkbook(
      [summarySheet, ...sheets] as never,
      payload.title,
    );
    return {
      buffer,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileName: `${fileBaseName(payload)}.xlsx`,
    };
  }

  private async toCsv(payload: ReportPayload): Promise<RenderedExport> {
    // Flat exports always contain the detailed register, never a breakdown table.
    const primary =
      payload.tables.find((table) => table.primary) ?? payload.tables[0];
    const csv = primary
      ? buildCsv(
          primary.columns.map((column) => ({ key: column.key, header: column.header })),
          primary.rows,
        )
      : buildCsv(
          [{ key: 'label', header: 'Metric' }, { key: 'value', header: 'Value' }],
          payload.summary.map((item) => ({ label: item.label, value: item.value })),
        );

    return {
      buffer: csv,
      contentType: 'text/csv; charset=utf-8',
      fileName: `${fileBaseName(payload)}.csv`,
    };
  }
}

export const reportExportService = new ReportExportService();
