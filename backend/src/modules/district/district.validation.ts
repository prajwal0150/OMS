import { z } from 'zod';
import { RECORD_STATUS } from '../../constants/enums';
import { optionalString, paginationSchema, requiredString } from '../../shared/validation';

export const districtListQuerySchema = paginationSchema.extend({
  status: z.enum(Object.values(RECORD_STATUS) as [string, ...string[]]).optional(),
});

export const createDistrictSchema = z.object({
  name: requiredString(3, 100),
  code: requiredString(2, 20),
  province: optionalString(60),
  country: optionalString(60),
  description: optionalString(1500),
  contact: z
    .object({
      phone: optionalString(30),
      email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
      address: optionalString(300),
    })
    .partial()
    .optional(),
  status: z.enum(Object.values(RECORD_STATUS) as [string, ...string[]]).optional(),
});

export const updateDistrictSchema = createDistrictSchema.partial();
