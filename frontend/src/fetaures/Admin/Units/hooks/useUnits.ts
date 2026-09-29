import { useListQuery, type UseListQueryOptions, type UseListQueryResult } from '../../../../shared/useListQuery';
import type { Unit } from '../../../../types';
import { fetchUnitList } from '../redux/unitThunk';
import { useAppSelector } from '../../../../store/hooks';
import {
  selectUnitError,
  selectUnitItems,
  selectUnitLoading,
  selectUnitPagination,
} from '../redux/unitSelector';

export interface UseUnitsResult extends UseListQueryResult {
  items: Unit[];
  loading: boolean;
  error: string | null;
  pagination: ReturnType<typeof selectUnitPagination>;
}

/** Single hook every Unit list screen uses: query state + store state. */
export function useUnits(options: UseListQueryOptions = {}): UseUnitsResult {
  const query = useListQuery(fetchUnitList, options);
  const items = useAppSelector(selectUnitItems);
  const loading = useAppSelector(selectUnitLoading);
  const error = useAppSelector(selectUnitError);
  const pagination = useAppSelector(selectUnitPagination);
  return { ...query, items, loading, error, pagination };
}
