import { z } from 'zod';
import { COMMUNITY_TARGET_GROUP, RECORD_STATUS } from '../../constants/enums';
import { optionalString, paginationSchema, requiredString } from '../../shared/validation';

export const communityListQuerySchema = paginationSchema.extend({
  status: z.enum(Object.values(RECORD_STATUS) as [string, ...string[]]).optional(),
  targetGroup: z
    .enum(Object.values(COMMUNITY_TARGET_GROUP) as [string, ...string[]])
    .optional(),
  unit: z.string().optional(),
});

export const createCommunitySchema = z.object({
  name: requiredString(2, 120),
  code: requiredString(2, 20),
  description: optionalString(1500),
  targetGroup: z.enum(Object.values(COMMUNITY_TARGET_GROUP) as [string, ...string[]]).optional(),
  ageGroup: optionalString(60),
  district: z.string().optional(),
  unit: optionalString(40),
  coordinator: optionalString(40),
  status: z.enum(Object.values(RECORD_STATUS) as [string, ...string[]]).optional(),
});

export const updateCommunitySchema = createCommunitySchema.partial();
