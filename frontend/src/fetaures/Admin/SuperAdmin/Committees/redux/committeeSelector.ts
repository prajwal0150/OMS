import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../../store/store';
import type { Committee } from '../../../../../types';
import type { ListState } from '../../../../../shared/listSlice';

const selectState = (state: RootState): ListState<Committee> => state.superAdmin.committees;

/* Memoized selectors for the Committee feature. */
export const selectCommitteeItems = createSelector([selectState], (s) => s.items);
export const selectCommitteePagination = createSelector([selectState], (s) => s.pagination);
export const selectCommitteeStatus = createSelector([selectState], (s) => s.status);
export const selectCommitteeError = createSelector([selectState], (s) => s.error);
export const selectCommitteeLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectCommitteeSelected = createSelector([selectState], (s) => s.selected);
export const selectCommitteeSelectedStatus = createSelector([selectState], (s) => s.selectedStatus);
export const selectCommitteeMutationStatus = createSelector([selectState], (s) => s.mutationStatus);
export const selectCommitteeMutationError = createSelector([selectState], (s) => s.mutationError);
