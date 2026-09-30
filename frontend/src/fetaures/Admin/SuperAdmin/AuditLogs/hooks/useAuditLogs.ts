import { useListQuery, type UseListQueryOptions, type UseListQueryResult } from '../../../../../shared/useListQuery';
import type { AuditLogEntry } from '../../../../../types';
import { fetchAuditLogList } from '../redux/auditLogThunk';
import { useAppSelector } from '../../../../../store/hooks';
import {
  selectAuditLogError,
  selectAuditLogItems,
  selectAuditLogLoading,
  selectAuditLogPagination,
} from '../redux/auditLogSelector';

export interface UseAuditLogsResult extends UseListQueryResult {
  items: AuditLogEntry[];
  loading: boolean;
  error: string | null;
  pagination: ReturnType<typeof selectAuditLogPagination>;
}

/** Single hook every AuditLog list screen uses: query state + store state. */
export function useAuditLogs(options: UseListQueryOptions = {}): UseAuditLogsResult {
  const query = useListQuery(fetchAuditLogList, options);
  const items = useAppSelector(selectAuditLogItems);
  const loading = useAppSelector(selectAuditLogLoading);
  const error = useAppSelector(selectAuditLogError);
  const pagination = useAppSelector(selectAuditLogPagination);
  return { ...query, items, loading, error, pagination };
}
