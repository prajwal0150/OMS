import PDFDocument from 'pdfkit';
import { ORGANIZATION_NAME } from '../../constants/enums';
import {
  FONT_BOLD,
  FONT_REGULAR,
  PDF_THEME,
  cellValue,
  getFrame,
} from './pdfTheme';
import type { PdfColumn } from './pdfTheme';
import {
  drawFilters,
  drawFooter,
  drawHeader,
  drawSummary,
} from './pdfSections';

export type { PdfColumn } from './pdfTheme';

export interface PdfTable {
  title?: string;
  columns: PdfColumn[];
  rows: Array<Record<string, string | number>>;
}

export interface PdfReportInput {
  title: string;
  subtitle?: string;
  logoPath?: string | null;
  generatedBy: string;
  generatedAt?: Date;
  filters?: Array<{ label: string; value: string }>;
  summary?: Array<{ label: string; value: string | number }>;
  /** Multi table reports (preferred). */
  tables?: PdfTable[];
  /** Single table shorthand. */
  columns?: PdfColumn[];
  rows?: Array<Record<string, string | number>>;
  notes?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Professional server side PDF report generation.
 * Every report contains organization branding, title, generated date/by,
 * applied filters, summary cards, the data table and page numbers.
 */
export const buildReportPdf = (input: PdfReportInput): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: input.orientation === 'landscape' ? 'landscape' : 'portrait',
        margins: { top: 40, bottom: 68, left: 40, right: 40 },
        bufferPages: true,
        info: { Title: input.title, Author: ORGANIZATION_NAME, Creator: 'HPS OMS' },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const generatedAt = input.generatedAt ?? new Date();
      drawHeader(doc, {
        title: input.title,
        subtitle: input.subtitle,
        logoPath: input.logoPath,
        generatedBy: input.generatedBy,
        generatedAt,
      });
      drawFilters(doc, input.filters ?? []);
      drawSummary(doc, input.summary ?? []);

      const frame = getFrame(doc);
      const tables: PdfTable[] =
        input.tables && input.tables.length > 0
          ? input.tables
          : [{ columns: input.columns ?? [], rows: input.rows ?? [] }];

      for (const table of tables) {
        const columns = table.columns;
        if (columns.length === 0) continue;
        const totalWeight = columns.reduce((sum, column) => sum + (column.weight ?? 1), 0);
        const widths = columns.map(
          (column) => ((column.weight ?? 1) / totalWeight) * frame.usableWidth,
        );

        const drawTableHeader = (): void => {
          const top = doc.y;
          const headerHeight = 20;
          doc.rect(frame.left, top, frame.usableWidth, headerHeight).fill(PDF_THEME.primary);
          let x = frame.left;
          columns.forEach((column, index) => {
            doc.font(FONT_BOLD).fontSize(8.5).fillColor(PDF_THEME.white)
              .text(column.header, x + 5, top + 6, {
                width: widths[index] - 10,
                align: column.align ?? 'left',
                lineBreak: false,
              });
            x += widths[index];
          });
          doc.y = top + headerHeight;
        };

        if (doc.y + 90 > frame.bottomLimit) doc.addPage();
        doc.font(FONT_BOLD).fontSize(10).fillColor(PDF_THEME.ink)
          .text(table.title ?? 'Data', frame.left, doc.y);
        doc.y += 14;
        drawTableHeader();

        if (table.rows.length === 0) {
          doc.font(FONT_REGULAR).fontSize(9).fillColor(PDF_THEME.muted)
            .text('No records matched the selected filters.', frame.left + 5, doc.y + 8, {
              width: frame.usableWidth,
            });
          doc.y += 26;
          continue;
        }

        table.rows.forEach((row, rowIndex) => {
          const cells = columns.map((column) => cellValue(row[column.key]));
          const heights = cells.map((value, index) =>
            doc.font(FONT_REGULAR).fontSize(8.5).heightOfString(value, { width: widths[index] - 10 }),
          );
          const rowHeight = Math.max(16, Math.min(60, Math.max(...heights, 0) + 8));

          if (doc.y + rowHeight > frame.bottomLimit) {
            doc.addPage();
            drawTableHeader();
          }
          const top = doc.y;
          if (rowIndex % 2 === 1) {
            doc.rect(frame.left, top, frame.usableWidth, rowHeight).fill(PDF_THEME.zebra);
          }
          doc.rect(frame.left, top, frame.usableWidth, rowHeight)
            .lineWidth(0.5).strokeColor(PDF_THEME.border).stroke();

          let x = frame.left;
          cells.forEach((value, index) => {
            doc.font(FONT_REGULAR).fontSize(8.5).fillColor(PDF_THEME.ink)
              .text(value, x + 5, top + 4, {
                width: widths[index] - 10,
                align: columns[index].align ?? 'left',
                height: rowHeight - 6,
                ellipsis: true,
              });
            x += widths[index];
          });
          doc.y = top + rowHeight;
        });
        doc.y += 12;
      }

      if (input.notes) {
        doc.y += 10;
        if (doc.y + 40 > frame.bottomLimit) doc.addPage();
        doc.font(FONT_REGULAR).fontSize(8).fillColor(PDF_THEME.muted)
          .text(input.notes, frame.left, doc.y, { width: frame.usableWidth });
      }

      drawFooter(doc, input.title, generatedAt);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
