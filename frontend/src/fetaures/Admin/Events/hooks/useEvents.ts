import { useListQuery, type UseListQueryOptions, type UseListQueryResult } from '../../../../shared/useListQuery';
import type { EventRecord } from '../../../../types';
import { fetchEventList } from '../redux/eventThunk';
import { useAppSelector } from '../../../../store/hooks';
import {
  selectEventError,
  selectEventItems,
  selectEventLoading,
  selectEventPagination,
} from '../redux/eventSelector';

export interface UseEventsResult extends UseListQueryResult {
  items: EventRecord[];
  loading: boolean;
  error: string | null;
  pagination: ReturnType<typeof selectEventPagination>;
}

/** Single hook every Event list screen uses: query state + store state. */
export function useEvents(options: UseListQueryOptions = {}): UseEventsResult {
  const query = useListQuery(fetchEventList, options);
  const items = useAppSelector(selectEventItems);
  const loading = useAppSelector(selectEventLoading);
  const error = useAppSelector(selectEventError);
  const pagination = useAppSelector(selectEventPagination);
  return { ...query, items, loading, error, pagination };
}
