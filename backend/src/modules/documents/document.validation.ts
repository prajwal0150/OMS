import { z } from 'zod';
import { DOCUMENT_CATEGORY, VISIBILITY } from '../../constants/enums';
import {
  optionalString,
  paginationSchema,
  requiredString,
} from '../../shared/validation';

export const documentListQuerySchema = paginationSchema.extend({
  category: z.enum(Object.values(DOCUMENT_CATEGORY) as [string, ...string[]]).optional(),
  visibility: z.enum(Object.values(VISIBILITY) as [string, ...string[]]).optional(),
  unit: optionalString(40),
  community: optionalString(40),
  event: optionalString(40),
  from: optionalString(40),
  to: optionalString(40),
});

export const uploadDocumentSchema = z.object({
  title: requiredString(3, 220),
  description: optionalString(1000),
  category: z.enum(Object.values(DOCUMENT_CATEGORY) as [string, ...string[]]).optional(),
  visibility: z.enum(Object.values(VISIBILITY) as [string, ...string[]]).optional(),
  unit: optionalString(40),
  community: optionalString(40),
  committee: optionalString(40),
  event: optionalString(40),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  date: optionalString(40),
});

export const updateDocumentSchema = uploadDocumentSchema.partial().omit({ tags: true }).extend({
  tags: z.array(z.string().max(40)).max(20).optional(),
});
