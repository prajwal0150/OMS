import { useCallback, useEffect, useState } from 'react';
import { normalizeApiError } from '../../../services/api/apiClient';
import type { PaginatedResult } from '../../../types';

export interface PublicListOptions {
  page?: number;
  limit?: number;
  search?: string;
  contentType?: string;
  unit?: string;
  community?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}
export interface PublicListState<T> {
  items: T[];
  pagination: PaginatedResult<T>['meta'];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  page: number;
  setPage: (page: number) => void;
  search: string;
  setSearch: (value: string) => void;
  setFilter: (name: string, value: string) => void;
  filters: Record<string, string>;
}

/**
 * Lightweight fetching hook for the public website. The public site has no
 * authenticated session, so it does not need the Redux store.
 */
export function usePublicList<T>(
  fetcher: (params: Record<string, unknown>) => Promise<PaginatedResult<T>>,
  options: PublicListOptions = {},
): PublicListState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginatedResult<T>['meta']>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(options.page ?? 1);
  const [search, setSearchState] = useState(options.search ?? '');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher({
        page,
        limit: options.limit ?? 12,
        ...(search ? { search } : {}),
        ...filters,
      });
      setItems(result.items);
      setPagination(result.meta);
    } catch (caught) {
      setError(normalizeApiError(caught).message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, page, search, JSON.stringify(filters), options.limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  const setFilter = useCallback((name: string, value: string) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  }, []);

  return {
    items,
    pagination,
    loading,
    error,
    refresh: () => void load(),
    page,
    setPage,
    search,
    setSearch,
    setFilter,
    filters,
  };
}

/** One-shot fetch for detail pages (content by slug, event, announcement). */
export function usePublicDetail<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (caught) {
      setError(normalizeApiError(caught).message);
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
