import { useListQuery, type UseListQueryOptions, type UseListQueryResult } from '../../../../shared/useListQuery';
import type { Committee } from '../../../../types';
import { fetchCommitteeList } from '../redux/committeeThunk';
import { useAppSelector } from '../../../../store/hooks';
import {
  selectCommitteeError,
  selectCommitteeItems,
  selectCommitteeLoading,
  selectCommitteePagination,
} from '../redux/committeeSelector';

export interface UseCommitteesResult extends UseListQueryResult {
  items: Committee[];
  loading: boolean;
  error: string | null;
  pagination: ReturnType<typeof selectCommitteePagination>;
}

/** Single hook every Committee list screen uses: query state + store state. */
export function useCommittees(options: UseListQueryOptions = {}): UseCommitteesResult {
  const query = useListQuery(fetchCommitteeList, options);
  const items = useAppSelector(selectCommitteeItems);
  const loading = useAppSelector(selectCommitteeLoading);
  const error = useAppSelector(selectCommitteeError);
  const pagination = useAppSelector(selectCommitteePagination);
  return { ...query, items, loading, error, pagination };
}
