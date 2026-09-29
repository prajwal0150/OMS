import { z } from 'zod';
import { RECORD_STATUS, TARGET_TYPE } from '../../constants/enums';
import {
  optionalDateSchema,
  optionalString,
  paginationSchema,
  requiredString,
} from '../../shared/validation';

export const announcementListQuerySchema = paginationSchema.extend({
  targetType: z.enum(Object.values(TARGET_TYPE) as [string, ...string[]]).optional(),
  status: z.enum(Object.values(RECORD_STATUS) as [string, ...string[]]).optional(),
  unit: optionalString(40),
  community: optionalString(40),
  committee: optionalString(40),
  from: optionalString(40),
  to: optionalString(40),
});

export const createAnnouncementSchema = z.object({
  title: requiredString(3, 220),
  content: requiredString(1, 6000),
  image: optionalString(500),
  attachment: optionalString(40),
  targetType: z.enum(Object.values(TARGET_TYPE) as [string, ...string[]]).optional(),
  district: optionalString(40),
  unit: optionalString(40),
  community: optionalString(40),
  committee: optionalString(40),
  selectedMembers: z.union([z.array(z.string()), z.string()]).optional(),
  publishDate: optionalDateSchema,
  expiryDate: optionalDateSchema,
  status: z.enum(Object.values(RECORD_STATUS) as [string, ...string[]]).optional(),
  isPublic: z.boolean().optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();
