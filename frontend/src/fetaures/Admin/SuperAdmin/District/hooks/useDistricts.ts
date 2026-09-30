import { useListQuery, type UseListQueryOptions, type UseListQueryResult } from '../../../../../shared/useListQuery';
import { useAppSelector } from '../../../../../store/hooks';
import type { District } from '../../../../../types';
import type { PaginationMeta } from '../../../../../types';
import { fetchDistrictList } from '../redux/districtThunk';
import {
  selectDistricts,
  selectDistrictsError,
  selectDistrictsLoading,
  selectDistrictsPagination,
} from '../redux/districtSelector';

export interface UseDistrictsResult extends UseListQueryResult {
  items: District[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta | null;
}

/** Single hook the district list screen uses: query state + store state. */
export function useDistricts(options: UseListQueryOptions = {}): UseDistrictsResult {
  const query = useListQuery(fetchDistrictList, { defaultSort: 'name', defaultOrder: 'asc', ...options });
  const items = useAppSelector(selectDistricts);
  const loading = useAppSelector(selectDistrictsLoading);
  const error = useAppSelector(selectDistrictsError);
  const pagination = useAppSelector(selectDistrictsPagination);
  return { ...query, items, loading, error, pagination };
}
