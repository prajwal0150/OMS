import { useListQuery, type UseListQueryOptions, type UseListQueryResult } from '../../../../../shared/useListQuery';
import type { ContentRecord } from '../../../../../types';
import { fetchContentList } from '../redux/contentThunk';
import { useAppSelector } from '../../../../../store/hooks';
import {
  selectContentError,
  selectContentItems,
  selectContentLoading,
  selectContentPagination,
} from '../redux/contentSelector';

export interface UseContentsResult extends UseListQueryResult {
  items: ContentRecord[];
  loading: boolean;
  error: string | null;
  pagination: ReturnType<typeof selectContentPagination>;
}

/** Single hook every Content list screen uses: query state + store state. */
export function useContent(options: UseListQueryOptions = {}): UseContentsResult {
  const query = useListQuery(fetchContentList, options);
  const items = useAppSelector(selectContentItems);
  const loading = useAppSelector(selectContentLoading);
  const error = useAppSelector(selectContentError);
  const pagination = useAppSelector(selectContentPagination);
  return { ...query, items, loading, error, pagination };
}
