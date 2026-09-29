import { useListQuery, type UseListQueryOptions, type UseListQueryResult } from '../../../../shared/useListQuery';
import type { AttendanceRecord } from '../../../../types';
import { fetchAttendanceList } from '../redux/attendanceThunk';
import { useAppSelector } from '../../../../store/hooks';
import {
  selectAttendanceError,
  selectAttendanceItems,
  selectAttendanceLoading,
  selectAttendancePagination,
} from '../redux/attendanceSelector';

export interface UseAttendancesResult extends UseListQueryResult {
  items: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  pagination: ReturnType<typeof selectAttendancePagination>;
}

/** Single hook every Attendance list screen uses: query state + store state. */
export function useAttendances(options: UseListQueryOptions = {}): UseAttendancesResult {
  const query = useListQuery(fetchAttendanceList, options);
  const items = useAppSelector(selectAttendanceItems);
  const loading = useAppSelector(selectAttendanceLoading);
  const error = useAppSelector(selectAttendanceError);
  const pagination = useAppSelector(selectAttendancePagination);
  return { ...query, items, loading, error, pagination };
}
