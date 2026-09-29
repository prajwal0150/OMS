import fs from 'node:fs';
import path from 'node:path';
import { env } from '../../config/env';

export const PDF_THEME = {
  primary: '#2563EB',
  ink: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  zebra: '#F8FAFC',
  white: '#FFFFFF',
};

export const FONT_REGULAR = 'Helvetica';
export const FONT_BOLD = 'Helvetica-Bold';

export interface PdfColumn {
  key: string;
  header: string;
  /** Relative column width (defaults to 1). */
  weight?: number;
  align?: 'left' | 'right' | 'center';
}

export interface PageFrame {
  left: number;
  usableWidth: number;
  bottomLimit: number;
}

export const cellValue = (value: string | number | undefined | null): string =>
  value === undefined || value === null ? '' : String(value);

export const getFrame = (doc: PDFKit.PDFDocument): PageFrame => ({
  left: doc.page.margins.left,
  usableWidth: doc.page.width - doc.page.margins.left - doc.page.margins.right,
  bottomLimit: doc.page.height - doc.page.margins.bottom,
});

/** Resolves a stored logo reference to a local file that PDFKit can embed. */
export const resolveLocalLogoPath = (logo?: string | null): string | null => {
  if (!logo) return null;
  const candidate = logo.startsWith('/uploads/')
    ? path.join(env.uploadDirAbsolute, logo.replace('/uploads/', ''))
    : path.isAbsolute(logo)
      ? logo
      : null;
  if (!candidate || !fs.existsSync(candidate)) return null;
  return /\.(png|jpe?g)$/i.test(candidate) ? candidate : null;
};
