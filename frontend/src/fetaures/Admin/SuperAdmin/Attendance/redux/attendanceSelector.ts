import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../../store/store';
import type { AttendanceRecord } from '../../../../../types';
import type { ListState } from '../../../../../shared/listSlice';

const selectState = (state: RootState): ListState<AttendanceRecord> => state.superAdmin.attendance;

/* Memoized selectors for the Attendance feature. */
export const selectAttendanceItems = createSelector([selectState], (s) => s.items);
export const selectAttendancePagination = createSelector([selectState], (s) => s.pagination);
export const selectAttendanceStatus = createSelector([selectState], (s) => s.status);
export const selectAttendanceError = createSelector([selectState], (s) => s.error);
export const selectAttendanceLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectAttendanceSelected = createSelector([selectState], (s) => s.selected);
export const selectAttendanceSelectedStatus = createSelector([selectState], (s) => s.selectedStatus);
export const selectAttendanceMutationStatus = createSelector([selectState], (s) => s.mutationStatus);
export const selectAttendanceMutationError = createSelector([selectState], (s) => s.mutationError);
