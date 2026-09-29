import { useListQuery, type UseListQueryOptions, type UseListQueryResult } from '../../../../shared/useListQuery';
import type { Community } from '../../../../types';
import { fetchCommunityList } from '../redux/communityThunk';
import { useAppSelector } from '../../../../store/hooks';
import {
  selectCommunityError,
  selectCommunityItems,
  selectCommunityLoading,
  selectCommunityPagination,
} from '../redux/communitySelector';

export interface UseCommunitysResult extends UseListQueryResult {
  items: Community[];
  loading: boolean;
  error: string | null;
  pagination: ReturnType<typeof selectCommunityPagination>;
}

/** Single hook every Community list screen uses: query state + store state. */
export function useCommunities(options: UseListQueryOptions = {}): UseCommunitysResult {
  const query = useListQuery(fetchCommunityList, options);
  const items = useAppSelector(selectCommunityItems);
  const loading = useAppSelector(selectCommunityLoading);
  const error = useAppSelector(selectCommunityError);
  const pagination = useAppSelector(selectCommunityPagination);
  return { ...query, items, loading, error, pagination };
}
