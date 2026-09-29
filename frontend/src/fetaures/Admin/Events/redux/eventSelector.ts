import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store/store';
import type { EventRecord } from '../../../../types';
import type { ListState } from '../../../../shared/listSlice';

const selectState = (state: RootState): ListState<EventRecord> => state.events;

/* Memoized selectors for the Event feature. */
export const selectEventItems = createSelector([selectState], (s) => s.items);
export const selectEventPagination = createSelector([selectState], (s) => s.pagination);
export const selectEventStatus = createSelector([selectState], (s) => s.status);
export const selectEventError = createSelector([selectState], (s) => s.error);
export const selectEventLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectEventSelected = createSelector([selectState], (s) => s.selected);
export const selectEventSelectedStatus = createSelector([selectState], (s) => s.selectedStatus);
export const selectEventMutationStatus = createSelector([selectState], (s) => s.mutationStatus);
export const selectEventMutationError = createSelector([selectState], (s) => s.mutationError);
