import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../../store/store';
import type { ContentRecord } from '../../../../../types';
import type { ListState } from '../../../../../shared/listSlice';

const selectState = (state: RootState): ListState<ContentRecord> => state.districtAdmin.content;

/* Memoized selectors for the Content feature. */
export const selectContentItems = createSelector([selectState], (s) => s.items);
export const selectContentPagination = createSelector([selectState], (s) => s.pagination);
export const selectContentStatus = createSelector([selectState], (s) => s.status);
export const selectContentError = createSelector([selectState], (s) => s.error);
export const selectContentLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectContentSelected = createSelector([selectState], (s) => s.selected);
export const selectContentSelectedStatus = createSelector([selectState], (s) => s.selectedStatus);
export const selectContentMutationStatus = createSelector([selectState], (s) => s.mutationStatus);
export const selectContentMutationError = createSelector([selectState], (s) => s.mutationError);
