import { z } from 'zod';
import { EXPORT_FORMAT, REPORT_TYPE } from '../../constants/enums';
import { optionalString, paginationSchema } from '../../shared/validation';

export const exportFormatEnum = z.nativeEnum(EXPORT_FORMAT);
export const reportTypeEnum = z.nativeEnum(REPORT_TYPE);

export const generateReportSchema = z.object({
  type: reportTypeEnum,
  format: exportFormatEnum,
  unit: optionalString(40),
  community: optionalString(40),
  district: optionalString(40),
  from: optionalString(40),
  to: optionalString(40),
  status: optionalString(40),
  membershipType: optionalString(40),
  gender: optionalString(20),
  targetType: optionalString(40),
  targetGroup: optionalString(40),
  saveRecord: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((val) => (typeof val === 'string' ? val === 'true' : val)),
});

export const reportHistoryQuerySchema = paginationSchema.extend({
  type: reportTypeEnum.optional(),
  format: exportFormatEnum.optional(),
  unit: optionalString(40),
  community: optionalString(40),
  from: optionalString(40),
  to: optionalString(40),
});

export const dashboardAnalyticsQuerySchema = z.object({
  unit: optionalString(40),
  community: optionalString(40),
});

export const trendQuerySchema = z.object({
  unit: optionalString(40),
  community: optionalString(40),
  months: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).max(24).optional()),
});

