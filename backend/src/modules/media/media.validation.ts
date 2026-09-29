import { z } from 'zod';
import { MEDIA_CATEGORY } from '../../constants/enums';
import { optionalString, paginationSchema } from '../../shared/validation';

export const mediaListQuerySchema = paginationSchema.extend({
  category: z.enum(Object.values(MEDIA_CATEGORY) as [string, ...string[]]).optional(),
  unit: optionalString(40),
  community: optionalString(40),
});

export const mediaUpdateSchema = z.object({
  title: optionalString(200),
  alt: optionalString(300),
  caption: optionalString(400),
  tags: z.array(z.string().max(40)).max(20).optional(),
});

export const mediaAttachSchema = z.object({
  mediaIds: z.array(z.string()).min(1),
  entity: z.enum(['Content', 'Event', 'Announcement', 'Member', 'Committee', 'Document']),
  entityId: z.string().min(1),
});
