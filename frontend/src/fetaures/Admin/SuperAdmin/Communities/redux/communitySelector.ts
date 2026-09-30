import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../../store/store';
import type { Community } from '../../../../../types';
import type { ListState } from '../../../../../shared/listSlice';

const selectState = (state: RootState): ListState<Community> => state.superAdmin.communities;

/* Memoized selectors for the Community feature. */
export const selectCommunityItems = createSelector([selectState], (s) => s.items);
export const selectCommunityPagination = createSelector([selectState], (s) => s.pagination);
export const selectCommunityStatus = createSelector([selectState], (s) => s.status);
export const selectCommunityError = createSelector([selectState], (s) => s.error);
export const selectCommunityLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectCommunitySelected = createSelector([selectState], (s) => s.selected);
export const selectCommunitySelectedStatus = createSelector([selectState], (s) => s.selectedStatus);
export const selectCommunityMutationStatus = createSelector([selectState], (s) => s.mutationStatus);
export const selectCommunityMutationError = createSelector([selectState], (s) => s.mutationError);
