import { createListSlice } from '../../../../shared/listSlice';
import { fetchAuditLogs, fetchAuditLogById as fetchOneById } from '../services/auditLogService';
import type { AuditLogEntry } from '../../../../types';

/**
 * AuditLog list + detail state.
 * The thunks and reducer are generated from the shared list factory so every
 * feature exposes the same request-status contract.
 */
const slice = createListSlice<AuditLogEntry>('auditLog', {
  fetchList: fetchAuditLogs,
  fetchOne: fetchOneById,
});

export const fetchAuditLogList = slice.fetchList;
export const fetchAuditLogById = slice.fetchOne!;
export const { mutationStarted, mutationSucceeded, mutationFailed, selectedCleared, upserted, removed, reset } = slice.actions;
export default slice.reducer;
