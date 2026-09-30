import { useListQuery, type UseListQueryOptions, type UseListQueryResult } from '../../../../../shared/useListQuery';
import type { Announcement } from '../../../../../types';
import { fetchAnnouncementList } from '../redux/announcementThunk';
import { useAppSelector } from '../../../../../store/hooks';
import {
  selectAnnouncementError,
  selectAnnouncementItems,
  selectAnnouncementLoading,
  selectAnnouncementPagination,
} from '../redux/announcementSelector';

export interface UseAnnouncementsResult extends UseListQueryResult {
  items: Announcement[];
  loading: boolean;
  error: string | null;
  pagination: ReturnType<typeof selectAnnouncementPagination>;
}

/** Single hook every Announcement list screen uses: query state + store state. */
export function useAnnouncements(options: UseListQueryOptions = {}): UseAnnouncementsResult {
  const query = useListQuery(fetchAnnouncementList, options);
  const items = useAppSelector(selectAnnouncementItems);
  const loading = useAppSelector(selectAnnouncementLoading);
  const error = useAppSelector(selectAnnouncementError);
  const pagination = useAppSelector(selectAnnouncementPagination);
  return { ...query, items, loading, error, pagination };
}
