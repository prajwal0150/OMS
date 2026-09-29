import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch } from '../store/hooks';

export interface ListQueryState {
  page: number;
  limit: number;
  search: string;
  sort: string;
  order: 'asc' | 'desc';
  filters: Record<string, string>;
}

export interface UseListQueryOptions {
  /** Extra params merged into every request (e.g. a fixed unit id). */
  defaults?: Record<string, string>;
  defaultSort?: string;
  defaultOrder?: 'asc' | 'desc';
  defaultLimit?: number;
  /** Skip fetching until a prerequisite (e.g. a parent id) is known. */
  enabled?: boolean;
}

export interface UseListQueryResult extends ListQueryState {
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (value: string) => void;
  setFilter: (name: string, value: string) => void;
  setFilters: (filters: Record<string, string>) => void;
  setSort: (field: string) => void;
  reset: () => void;
  params: Record<string, unknown>;
  refresh: () => void;
}

/**
 * Minimal structural shape needed to dispatch a list fetch. Keeping this loose
 * decouples feature hooks from the exact AsyncThunk generic parameters.
 */
export interface ListThunk {
  (arg: Record<string, unknown>): unknown;
  typePrefix?: string;
}

/**
 * Owns pagination / search / sorting / filtering for a list screen and
 * re-dispatches the feature's fetch thunk whenever the effective query changes.
 * Empty filter values are omitted so the backend never receives `?unit=`.
 */
export function useListQuery(fetchList: ListThunk, options: UseListQueryOptions = {}): UseListQueryResult {
  const dispatch = useAppDispatch();
  const {
    defaults = {},
    defaultSort = 'createdAt',
    defaultOrder = 'desc',
    defaultLimit = 20,
    enabled = true,
  } = options;

  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(defaultLimit);
  const [search, setSearchState] = useState('');
  const [sort, setSortState] = useState(defaultSort);
  const [order, setOrderState] = useState<'asc' | 'desc'>(defaultOrder);
  const [filters, setFiltersState] = useState<Record<string, string>>(defaults);

  const params = useMemo(
    () => ({
      page,
      limit,
      sort,
      order,
      ...(search ? { search } : {}),
      ...Object.fromEntries(
        Object.entries({ ...defaults, ...filters }).filter(([, value]) => value !== '' && value != null),
      ),
    }),
    [page, limit, sort, order, search, filters, defaults],
  );

  const serialized = JSON.stringify(params);
  const firstRun = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    if (firstRun.current) firstRun.current = false;
    dispatch(fetchList(JSON.parse(serialized) as Record<string, unknown>) as never);
  }, [dispatch, fetchList, serialized, enabled]);

  /** Any search or filter change returns to the first page. */
  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  const setFilter = useCallback((name: string, value: string) => {
    setFiltersState((current) => ({ ...current, [name]: value }));
    setPage(1);
  }, []);

  const setFilters = useCallback((next: Record<string, string>) => {
    setFiltersState({ ...defaults, ...next });
    setPage(1);
  }, [defaults]);

  const setLimit = useCallback((value: number) => {
    setLimitState(value);
    setPage(1);
  }, []);

  const setSort = useCallback((field: string) => {
    setSortState((current) => {
      if (current === field) {
        setOrderState((currentOrder) => (currentOrder === 'asc' ? 'desc' : 'asc'));
        return current;
      }
      setOrderState('desc');
      return field;
    });
    setPage(1);
  }, []);

  const reset = useCallback(() => {
    setSearchState('');
    setFiltersState(defaults);
    setSortState(defaultSort);
    setOrderState(defaultOrder);
    setPage(1);
  }, [defaults, defaultSort, defaultOrder]);

  const refresh = useCallback(() => {
    dispatch(fetchList(JSON.parse(serialized) as Record<string, unknown>) as never);
  }, [dispatch, fetchList, serialized]);

  return {
    page,
    limit,
    search,
    sort,
    order,
    filters,
    setPage,
    setLimit,
    setSearch,
    setFilter,
    setFilters,
    setSort,
    reset,
    params,
    refresh,
  };
}
