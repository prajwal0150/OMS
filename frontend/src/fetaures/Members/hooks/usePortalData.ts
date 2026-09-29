import { useCallback, useEffect, useState } from 'react';
import { normalizeApiError } from '../../../services/api/apiClient';
import type { PaginatedResult } from '../../../types';

export interface PortalListState<T> {
  items: T[];
  pagination: PaginatedResult<T>['meta'];
  loading: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
  search: string;
  setSearch: (value: string) => void;
  refresh: () => void;
}

export interface PortalListOptions {
  limit?: number;
  extraParams?: Record<string, string>;
}

/**
 * Simple paginated fetching for the member portal. The portal has no Redux
 * slices of its own — the backend already scopes every response to the member.
 */
export function usePortalList<T>(
  fetcher: (params: Record<string, unknown>) => Promise<PaginatedResult<T>>,
  options: PortalListOptions = {},
): PortalListState<T> {
  const { limit = 10, extraParams } = options;
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginatedResult<T>['meta']>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState('');
  const [tick, setTick] = useState(0);
  // Serialised so the effect can depend on a primitive instead of an object
  // identity that callers recreate on every render.
  const paramsKey = JSON.stringify(extraParams ?? {});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const params = JSON.parse(paramsKey) as Record<string, string>;
    fetcher({ page, limit, ...(search ? { search } : {}), ...params })
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setPagination(result.meta);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(normalizeApiError(caught).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetcher, page, search, tick, limit, paramsKey]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  return {
    items,
    pagination,
    loading,
    error,
    page,
    setPage,
    search,
    setSearch,
    refresh: () => setTick((value) => value + 1),
  };
}

/** One-shot fetch for the member dashboard. */
export function usePortalData<T>(loader: () => Promise<T>) {
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
