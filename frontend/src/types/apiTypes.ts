/**
 * API response envelope shared with the Express backend.
 * Keep this in sync with `backend/src/types/api.ts`.
 */

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiMeta {
  [key: string]: unknown;
  pagination?: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: ApiErrorDetail[];
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: unknown;
}

/**
 * Result of a list endpoint after unwrapping the response envelope:
 * the rows plus the pagination metadata supplied in `meta.pagination`.
 */
export interface PaginatedResult<T> {
  items: T[];
  meta?: ApiMeta & { pagination?: PaginationMeta };
}

export interface OptionItem {
  _id: string;
  name: string;
  code?: string;
  status?: string;
  unit?: string | { _id: string; name: string } | null;
}

export interface UserOption {
  id: string;
  label: string;
  email: string;
  role: string;
  status: string;
  district: string | null;
  unit: string | null;
  community: string | null;
}
