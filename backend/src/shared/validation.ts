import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

/** Reusable validation primitives shared by every module validation schema. */
export const objectIdSchema = z
  .string()
  .refine((value) => isValidObjectId(value), { message: 'Invalid identifier' });

export const optionalObjectId = z
  .string()
  .optional()
  .nullable()
  .transform((value) => (value === null || value === '' ? undefined : value))
  .refine((value) => value === undefined || isValidObjectId(value), {
    message: 'Invalid identifier',
  });

export const optionalString = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((value) => (value === '' ? undefined : value));

export const requiredString = (min = 1, max = 500) =>
  z.string().trim().min(min, `Must be at least ${min} character(s)`).max(max);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  search: z.string().trim().max(150).optional(),
  sort: z.string().trim().max(60).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const dateOnlySchema = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), { message: 'Invalid date' });

export const optionalDateSchema = z
  .string()
  .optional()
  .nullable()
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
    message: 'Invalid date',
  })
  .transform((value) => (value ? new Date(value) : undefined));

export const idParamsSchema = z.object({ id: objectIdSchema });

export const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), {
    message: 'Must be a valid http(s) URL',
  })
  .transform((value) => (value === '' ? undefined : value));

export const phoneSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || /^[0-9+\-\s()]{7,20}$/.test(value), {
    message: 'Enter a valid phone number',
  })
  .transform((value) => (value === '' ? undefined : value));

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');

export const listOfObjectIds = z
  .union([z.array(objectIdSchema), objectIdSchema])
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    return Array.isArray(value) ? value : [value];
  });

/**
 * List query identifiers accept either a Mongo id or a human friendly
 * code/name. The service layer resolves non-id values to identifiers.
 */
export const objectIdOrName = (max = 200) => z.string().trim().min(1).max(max);
