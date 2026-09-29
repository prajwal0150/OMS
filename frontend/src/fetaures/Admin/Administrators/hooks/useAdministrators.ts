import { useListQuery, type UseListQueryOptions, type UseListQueryResult } from '../../../../shared/useListQuery';
import type { UserAccount } from '../../../../types';
import { fetchAdministratorList } from '../redux/administratorThunk';
import { useAppSelector } from '../../../../store/hooks';
import {
  selectAdministratorError,
  selectAdministratorItems,
  selectAdministratorLoading,
  selectAdministratorPagination,
} from '../redux/administratorSelector';

export interface UseAdministratorsResult extends UseListQueryResult {
  items: UserAccount[];
  loading: boolean;
  error: string | null;
  pagination: ReturnType<typeof selectAdministratorPagination>;
}

/** Single hook every Administrator list screen uses: query state + store state. */
export function useAdministrators(options: UseListQueryOptions = {}): UseAdministratorsResult {
  const query = useListQuery(fetchAdministratorList, options);
  const items = useAppSelector(selectAdministratorItems);
  const loading = useAppSelector(selectAdministratorLoading);
  const error = useAppSelector(selectAdministratorError);
  const pagination = useAppSelector(selectAdministratorPagination);
  return { ...query, items, loading, error, pagination };
}
