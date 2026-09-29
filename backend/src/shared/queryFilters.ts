import mongoose from 'mongoose';
import type { FilterQuery } from 'mongoose';
import { ApiError } from '../utils/ApiError';

type QueryLike = Record<string, unknown>;

/** Reads a repeated or comma separated query parameter as a list of values. */
export const readList = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = Array.isArray(value) ? value.map(String) : String(value).split(',');
  const cleaned = raw.map((item) => item.trim()).filter((item) => item.length > 0);
  return cleaned.length > 0 ? cleaned : undefined;
};

/** Validates a list of Mongo identifiers, rejecting malformed values with 400. */
export const readObjectIds = (value: unknown): mongoose.Types.ObjectId[] | undefined => {
  const list = readList(value);
  if (!list) return undefined;
  return list.map((id) => {
    if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest(`Invalid identifier: ${id}`);
    return new mongoose.Types.ObjectId(id);
  });
};

export const readObjectId = (value: unknown): mongoose.Types.ObjectId | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = String(value);
  if (!mongoose.isValidObjectId(raw)) throw ApiError.badRequest(`Invalid identifier: ${raw}`);
  return new mongoose.Types.ObjectId(raw);
};

export const readEnum = <T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = String(value).toUpperCase();
  if (!(allowed as readonly string[]).includes(raw)) {
    throw ApiError.badRequest(`Unsupported value "${String(value)}"`);
  }
  return raw as T;
};

export const readBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = String(value).toLowerCase();
  if (['true', '1', 'yes'].includes(raw)) return true;
  if (['false', '0', 'no'].includes(raw)) return false;
  return undefined;
};

export const readDate = (value: unknown, label = 'date'): Date | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) throw ApiError.badRequest(`Invalid ${label}`);
  return parsed;
};

/** Builds a `$gte`/`$lte` range filter, returning {} when no bounds were supplied. */
export const buildDateRange = (
  from?: unknown,
  to?: unknown,
  options: { endOfDay?: boolean } = {},
): QueryLike => {
  const start = readDate(from, 'start date');
  const end = readDate(to, 'end date');
  if (!start && !end) return {};
  const range: QueryLike = {};
  if (start) range.$gte = start;
  if (end) {
    if (options.endOfDay) end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return range;
};

/** Maps simple query parameters onto model fields (equality filters). */
export const buildEqualsFilter = (
  params: QueryLike,
  mapping: Record<string, string>,
): QueryLike => {
  const filter: QueryLike = {};
  for (const [param, field] of Object.entries(mapping)) {
    const value = params[param];
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      const list = readList(value);
      if (list) filter[field] = { $in: list };
      continue;
    }
    filter[field] = value;
  }
  return filter;
};

export const combineFilters = (...filters: QueryLike[]): FilterQuery<unknown> => {
  const conditions = filters.filter((filter) => Object.keys(filter).length > 0);
  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0] as FilterQuery<unknown>;
  return { $and: conditions } as FilterQuery<unknown>;
};

/** Ensures the regex is a valid pattern, falling back to a literal search. */
export const safeSearchTerm = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};
