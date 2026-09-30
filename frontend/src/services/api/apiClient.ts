import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorDetail, ApiResponse, PaginationMeta } from '../../types';

/**
 * Global Axios client (src/services/api/apiClient.ts).
 * Responsibilities: base URL, access token injection, transparent refresh on
 * 401 (single-flight) and normalisation of the backend error envelope.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const ACCESS_TOKEN_KEY = 'hps.accessToken';
const REFRESH_TOKEN_KEY = 'hps.refreshToken';

export const tokenStorage = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  set(access: string, refresh: string | null): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export interface NormalizedApiError extends Error {
  status: number;
  details: ApiErrorDetail[];
  /** Field name -> message, derived from the backend validation envelope. */
  fieldErrors: Record<string, string>;
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request could not be processed. Please check the details and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You are not allowed to perform this action.',
  404: 'The requested record was not found.',
  409: 'This record already exists.',
  422: 'Some of the values provided are not valid.',
  429: 'Too many requests. Please slow down and try again shortly.',
  500: 'The server ran into a problem. Please try again.',
};

/** Converts anything thrown by Axios into a predictable, user-safe error. */
export const normalizeApiError = (error: unknown): NormalizedApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; errors?: ApiErrorDetail[] }>;
    const status = axiosError.response?.status ?? 0;
    const details = axiosError.response?.data?.errors ?? [];
    const fieldErrors: Record<string, string> = {};
    details.forEach((detail) => {
      if (detail.field && !fieldErrors[detail.field]) fieldErrors[detail.field] = detail.message;
    });

    let message = axiosError.response?.data?.message ?? '';
    if (!axiosError.response) {
      message =
        axiosError.code === 'ECONNABORTED'
          ? 'The request timed out. Please try again.'
          : 'Unable to reach the server. Check your connection and try again.';
    }
    if (!message) message = STATUS_MESSAGES[status] ?? 'Something went wrong';

    const normalized = new Error(message) as NormalizedApiError;
    normalized.status = status;
    normalized.details = details;
    normalized.fieldErrors = fieldErrors;
    return normalized;
  }

  if (error instanceof Error) {
    const normalized = error as NormalizedApiError;
    normalized.status = 0;
    normalized.details = [];
    normalized.fieldErrors = {};
    return normalized;
  }

  const normalized = new Error('Something went wrong') as NormalizedApiError;
  normalized.status = 0;
  normalized.details = [];
  normalized.fieldErrors = {};
  return normalized;
};

/** Invoked when refreshing fails so the store can clear the session. */
let onSessionExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (handler: (() => void) | null): void => {
  onSessionExpired = handler;
};

const AUTH_FREE_ENDPOINTS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
];

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  const url = config.url ?? '';
  const isAuthFree = AUTH_FREE_ENDPOINTS.some((endpoint) => url.includes(endpoint));
  if (token && !isAuthFree) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

/** Single-flight refresh so parallel 401s trigger only one refresh request. */
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
    `${BASE_URL}/auth/refresh`,
    { refreshToken },
  );

  const { accessToken, refreshToken: nextRefresh } = response.data.data;
  tokenStorage.set(accessToken, nextRefresh);
  return accessToken;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as AxiosError;
    const config = axiosError.config as RetriableConfig | undefined;
    const status = axiosError.response?.status;

    if (status === 401 && config && !config._retried) {
      const url = config.url ?? '';
      const isAuthFree = AUTH_FREE_ENDPOINTS.some((endpoint) => url.includes(endpoint));
      if (!isAuthFree) {
        config._retried = true;
        try {
          refreshPromise = refreshPromise ?? refreshAccessToken();
          const token = await refreshPromise;
          refreshPromise = null;
          config.headers.Authorization = `Bearer ${token}`;
          return await apiClient.request(config);
        } catch {
          refreshPromise = null;
          tokenStorage.clear();
          onSessionExpired?.();
        }
      }
    }

    return Promise.reject(error);
  },
);

/* ------------------------------------------------------------------ *
 * Response helpers - every endpoint returns { success, message, data, meta }.
 * ------------------------------------------------------------------ */

/** Returns `data` from the { success, message, data, meta } response envelope. */
export const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

/**
 * Unwraps a list response into `{ items, meta }`.
 *
 * The `data` key is absent on error envelopes ({ success: false, message,
 * errors }) and on a 404 from an unmatched route. Returning it unguarded made
 * `items` undefined, and the first `.length` read in the consuming component
 * threw "Cannot read properties of undefined (reading 'length')", taking the
 * whole page down instead of showing an error. Coerce to an array so a shape
 * mismatch degrades to an empty list rather than a white screen.
 */
export const unwrapList = <T>(response: {
  data: { data?: T[]; meta?: ApiResponse<T[]>['meta'] };
}): { items: T[]; meta?: ApiResponse<T[]>['meta'] } => ({
  items: Array.isArray(response.data.data) ? response.data.data : [],
  meta: response.data.meta,
});

/** Turns list query params into a clean query string (drops empty values). */
export const toQueryParams = (params?: Record<string, unknown>): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!params) return result;
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      const joined = value.filter(Boolean).map(String).join(',');
      if (joined) result[key] = joined;
      return;
    }
    result[key] = String(value);
  });
  return result;
};

/** GET a paginated list and return `{ items, meta }` ready for the store. */
export const getList = async <T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<{ items: T[]; meta?: ApiResponse<T[]>['meta'] }> =>
  unwrapList<T>(await apiClient.get(path, { params: toQueryParams(params) }));

export interface PaginatedPayload<T> {
  items: T[];
  meta?: ApiResponse<T[]>['meta'] & { pagination?: PaginationMeta };
}

export default apiClient;

