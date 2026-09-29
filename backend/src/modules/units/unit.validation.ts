import { z } from 'zod';
import { RECORD_STATUS } from '../../constants/enums';
import {
  optionalDateSchema,
  optionalString,
  paginationSchema,
  phoneSchema,
  requiredString,
} from '../../shared/validation';

export const unitListQuerySchema = paginationSchema.extend({
  status: z.enum(Object.values(RECORD_STATUS) as [string, ...string[]]).optional(),
  district: z.string().optional(),
});

export const createUnitSchema = z.object({
  name: requiredString(2, 120),
  code: requiredString(2, 20),
  description: optionalString(1500),
  location: optionalString(150),
  contactPerson: optionalString(120),
  phone: phoneSchema,
  email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
  address: optionalString(300),
  district: z.string().optional(),
  establishedDate: optionalDateSchema,
  status: z.enum(Object.values(RECORD_STATUS) as [string, ...string[]]).optional(),
});

export const updateUnitSchema = createUnitSchema.partial();
