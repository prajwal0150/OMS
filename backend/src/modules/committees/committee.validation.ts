import { z } from 'zod';
import { COMMITTEE_LEVEL, COMMITTEE_POSITION, RECORD_STATUS } from '../../constants/enums';
import {
  optionalDateSchema,
  optionalString,
  paginationSchema,
  requiredString,
} from '../../shared/validation';

export const committeeListQuerySchema = paginationSchema.extend({
  level: z.enum(Object.values(COMMITTEE_LEVEL) as [string, ...string[]]).optional(),
  status: z.enum(Object.values(RECORD_STATUS) as [string, ...string[]]).optional(),
  unit: optionalString(40),
  community: optionalString(40),
});

export const createCommitteeSchema = z.object({
  name: requiredString(3, 150),
  level: z.enum(Object.values(COMMITTEE_LEVEL) as [string, ...string[]]),
  description: optionalString(1500),
  district: optionalString(40),
  unit: optionalString(40),
  community: optionalString(40),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  status: z.enum(Object.values(RECORD_STATUS) as [string, ...string[]]).optional(),
});

export const updateCommitteeSchema = createCommitteeSchema.partial();

export const positionBaseSchema = z.object({
  position: z.enum(Object.values(COMMITTEE_POSITION) as [string, ...string[]]),
  member: optionalString(40),
  remarks: optionalString(300),
  assignedDate: optionalDateSchema,
  endDate: optionalDateSchema,
});

export const assignPositionSchema = positionBaseSchema;

export const updatePositionSchema = positionBaseSchema
  .partial()
  .extend({ active: z.boolean().optional() });
