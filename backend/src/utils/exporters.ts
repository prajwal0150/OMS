import ExcelJS from 'exceljs';

export interface ExportColumn<T> {
  key: keyof T & string;
  header: string;
  width?: number;
  transform?: (row: T) => string | number;
}

const escapeCsvValue = (value: unknown): string => {
  const raw = value === null || value === undefined ? '' : String(value);
  const needsQuoting = /[",\n\r;]/.test(raw);
  const escaped = raw.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
};

/** Serialises rows to CSV. A UTF-8 BOM keeps Excel happy with non ASCII characters. */
export const buildCsv = <T extends Record<string, unknown>>(
  columns: ExportColumn<T>[],
  rows: T[],
): string => {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(',');
  const body = rows.map((row) =>
    columns
      .map((column) =>
        escapeCsvValue(column.transform ? column.transform(row) : row[column.key]),
      )
      .join(','),
  );
  return `\uFEFF${[header, ...body].join('\r\n')}`;
};

export interface ExcelSheet<T> {
  name: string;
  columns: ExportColumn<T>[];
  rows: T[];
}

/** Builds a styled workbook buffer (header band, frozen header row, auto filter). */
export const buildExcelWorkbook = async <T extends Record<string, unknown>>(
  sheets: ExcelSheet<T>[],
  title = 'Report',
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HEAVENLY PATH SUNSARI DISTRICT OMS';
  workbook.created = new Date();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name.slice(0, 31));
    worksheet.columns = sheet.columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: column.width ?? Math.max(14, column.header.length + 4),
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
    headerRow.height = 20;

    for (const row of sheet.rows) {
      const values: Record<string, string | number> = {};
      for (const column of sheet.columns) {
        values[column.key] = column.transform
          ? column.transform(row)
          : ((row[column.key] as string | number) ?? '');
      }
      const appended = worksheet.addRow(values);
      appended.alignment = { vertical: 'middle' };
    }

    if (sheet.columns.length > 0) {
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: sheet.columns.length },
      };
    }
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.headerFooter.oddFooter = `&L${title}&CPage &P of &N`;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
