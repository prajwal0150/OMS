import { z } from 'zod';
import { EVENT_LEVEL, EVENT_STATUS, EVENT_TYPE } from '../../constants/enums';
import {
  dateOnlySchema,
  optionalDateSchema,
  optionalString,
  paginationSchema,
  requiredString,
} from '../../shared/validation';

export const eventListQuerySchema = paginationSchema.extend({
  type: z.enum(Object.values(EVENT_TYPE) as [string, ...string[]]).optional(),
  level: z.enum(Object.values(EVENT_LEVEL) as [string, ...string[]]).optional(),
  status: z.enum(Object.values(EVENT_STATUS) as [string, ...string[]]).optional(),
  unit: optionalString(40),
  community: optionalString(40),
  committee: optionalString(40),
  from: optionalString(40),
  to: optionalString(40),
});

export const createEventSchema = z.object({
  title: requiredString(3, 200),
  description: optionalString(4000),
  type: z.enum(Object.values(EVENT_TYPE) as [string, ...string[]]).optional(),
  level: z.enum(Object.values(EVENT_LEVEL) as [string, ...string[]]).optional(),
  organizer: optionalString(150),
  location: optionalString(200),
  startDate: dateOnlySchema,
  endDate: optionalDateSchema,
  startTime: optionalString(10),
  endTime: optionalString(10),
  capacity: z.coerce.number().int().min(0).optional(),
  status: z.enum(Object.values(EVENT_STATUS) as [string, ...string[]]).optional(),
  coverImage: optionalString(400),
  documents: z.union([z.array(z.string()), z.string()]).optional(),
  district: optionalString(40),
  unit: optionalString(40),
  community: optionalString(40),
  committee: optionalString(40),
});

export const updateEventSchema = createEventSchema.partial();

export const publicEventQuerySchema = paginationSchema.extend({
  type: z.enum(Object.values(EVENT_TYPE) as [string, ...string[]]).optional(),
  unit: optionalString(40),
  community: optionalString(40),
});
