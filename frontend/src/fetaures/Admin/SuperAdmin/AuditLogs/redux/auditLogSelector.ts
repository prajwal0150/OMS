import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../../store/store';
import type { AuditLogEntry } from '../../../../../types';
import type { ListState } from '../../../../../shared/listSlice';

const selectState = (state: RootState): ListState<AuditLogEntry> => state.superAdmin.auditLogs;

/* Memoized selectors for the AuditLog feature. */
export const selectAuditLogItems = createSelector([selectState], (s) => s.items);
export const selectAuditLogPagination = createSelector([selectState], (s) => s.pagination);
export const selectAuditLogStatus = createSelector([selectState], (s) => s.status);
export const selectAuditLogError = createSelector([selectState], (s) => s.error);
export const selectAuditLogLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectAuditLogSelected = createSelector([selectState], (s) => s.selected);
export const selectAuditLogSelectedStatus = createSelector([selectState], (s) => s.selectedStatus);
export const selectAuditLogMutationStatus = createSelector([selectState], (s) => s.mutationStatus);
export const selectAuditLogMutationError = createSelector([selectState], (s) => s.mutationError);
