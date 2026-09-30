import { useListQuery, type UseListQueryOptions, type UseListQueryResult } from '../../../../../shared/useListQuery';
import type { Member } from '../../../../../types';
import { fetchMemberList } from '../redux/memberThunk';
import { useAppSelector } from '../../../../../store/hooks';
import {
  selectMemberError,
  selectMemberItems,
  selectMemberLoading,
  selectMemberPagination,
} from '../redux/memberSelector';

export interface UseMembersResult extends UseListQueryResult {
  items: Member[];
  loading: boolean;
  error: string | null;
  pagination: ReturnType<typeof selectMemberPagination>;
}

/** Single hook every Member list screen uses: query state + store state. */
export function useMembers(options: UseListQueryOptions = {}): UseMembersResult {
  const query = useListQuery(fetchMemberList, options);
  const items = useAppSelector(selectMemberItems);
  const loading = useAppSelector(selectMemberLoading);
  const error = useAppSelector(selectMemberError);
  const pagination = useAppSelector(selectMemberPagination);
  return { ...query, items, loading, error, pagination };
}
