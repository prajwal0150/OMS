import type { PaginationMeta } from '../types/api';

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

type QueryInput = Record<string, unknown>;

const toNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parsePagination = (
  query: QueryInput = {},
  options: { defaultLimit?: number; allowedSortFields?: string[]; defaultSort?: string } = {},
): PaginationOptions => {
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const page = Math.max(1, Math.trunc(toNumber(query.page) ?? 1));
  const rawLimit = Math.trunc(toNumber(query.limit) ?? defaultLimit);
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));

  const requestedSort = typeof query.sort === 'string' && query.sort.length > 0
    ? query.sort
    : options.defaultSort ?? 'createdAt';
  const order = query.order === 'asc' ? 1 : -1;

  const fields = requestedSort
    .split(',')
    .map((field) => field.trim())
    .filter((field) => field.length > 0)
    .filter((field) =>
      options.allowedSortFields && options.allowedSortFields.length > 0
        ? options.allowedSortFields.includes(field)
        : true,
    );

  const sort: Record<string, 1 | -1> = {};
  for (const field of fields.length > 0 ? fields : ['createdAt']) {
    sort[field] = order;
  }

  return { page, limit, skip: (page - 1) * limit, sort };
};

export const buildPaginationMeta = (total: number, page: number, limit: number): PaginationMeta => {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1 && totalPages > 0,
  };
};
