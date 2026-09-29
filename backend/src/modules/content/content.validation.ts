import { z } from 'zod';
import { CONTENT_STATUS, CONTENT_TYPE, VIDEO_TYPE, VISIBILITY } from '../../constants/enums';
import {
  optionalDateSchema,
  optionalString,
  optionalUrl,
  paginationSchema,
  requiredString,
} from '../../shared/validation';

export const contentListQuerySchema = paginationSchema.extend({
  contentType: z.enum(Object.values(CONTENT_TYPE) as [string, ...string[]]).optional(),
  status: z.enum(Object.values(CONTENT_STATUS) as [string, ...string[]]).optional(),
  visibility: z.enum(Object.values(VISIBILITY) as [string, ...string[]]).optional(),
  unit: optionalString(40),
  community: optionalString(40),
  committee: optionalString(40),
  event: optionalString(40),
  author: optionalString(40),
  from: optionalString(40),
  to: optionalString(40),
});

export const publicContentQuerySchema = paginationSchema.extend({
  contentType: z.enum(Object.values(CONTENT_TYPE) as [string, ...string[]]).optional(),
  unit: optionalString(40),
  community: optionalString(40),
});

const galleryItemSchema = z.object({
  url: requiredString(1, 500),
  caption: optionalString(300),
  alt: optionalString(300),
  order: z.coerce.number().int().min(0).optional(),
  isCover: z.boolean().optional(),
});

const videoSchema = z.object({
  videoType: z.enum(Object.values(VIDEO_TYPE) as [string, ...string[]]).optional(),
  videoUrl: requiredString(1, 500),
  thumbnail: optionalString(500),
  caption: optionalString(300),
});

const contentBaseSchema = z.object({
  title: requiredString(3, 250),
  summary: optionalString(600),
  content: z.string().max(120000).optional(),
  contentType: z.enum(Object.values(CONTENT_TYPE) as [string, ...string[]]).optional(),
  coverImage: optionalString(500),
  gallery: z.array(galleryItemSchema).max(60).optional(),
  videos: z.array(videoSchema).max(20).optional(),
  documents: z.union([z.array(z.string()), z.string()]).optional(),
  district: optionalString(40),
  unit: optionalString(40),
  community: optionalString(40),
  committee: optionalString(40),
  event: optionalString(40),
  visibility: z.enum(Object.values(VISIBILITY) as [string, ...string[]]).optional(),
  scheduledAt: optionalDateSchema,
  tags: z.array(z.string().max(40)).max(20).optional(),
});

export const createContentSchema = contentBaseSchema;

export const updateContentSchema = contentBaseSchema.partial();

export const submitContentSchema = z.object({ notes: optionalString(600) });

export const reviewContentSchema = z.object({
  notes: optionalString(600),
  reason: optionalString(600),
});

export const publishContentSchema = z.object({
  scheduledAt: optionalDateSchema,
  notes: optionalString(600),
});

export const mediaUrlSchema = z.object({
  url: requiredString(1, 500),
  caption: optionalString(300),
  alt: optionalString(300),
  isCover: z.boolean().optional(),
});

export const videoUrlSchema = videoSchema;

export const externalVideoUrlSchema = z.object({
  videoUrl: optionalUrl,
  videoType: z.enum(['YOUTUBE', 'VIMEO', 'EXTERNAL']).optional(),
  caption: optionalString(300),
  thumbnail: optionalString(500),
});
