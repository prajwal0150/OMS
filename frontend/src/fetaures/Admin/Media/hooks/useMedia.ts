import { useListQuery, type UseListQueryOptions, type UseListQueryResult } from '../../../../shared/useListQuery';
import type { MediaItem } from '../../../../types';
import { fetchMediaList } from '../redux/mediaThunk';
import { useAppSelector } from '../../../../store/hooks';
import {
  selectMediaError,
  selectMediaItems,
  selectMediaLoading,
  selectMediaPagination,
} from '../redux/mediaSelector';

export interface UseMediasResult extends UseListQueryResult {
  items: MediaItem[];
  loading: boolean;
  error: string | null;
  pagination: ReturnType<typeof selectMediaPagination>;
}

/** Single hook every Media list screen uses: query state + store state. */
export function useMedia(options: UseListQueryOptions = {}): UseMediasResult {
  const query = useListQuery(fetchMediaList, options);
  const items = useAppSelector(selectMediaItems);
  const loading = useAppSelector(selectMediaLoading);
  const error = useAppSelector(selectMediaError);
  const pagination = useAppSelector(selectMediaPagination);
  return { ...query, items, loading, error, pagination };
}
