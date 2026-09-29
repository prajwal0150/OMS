import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store/store';
import type { Member } from '../../../../types';
import type { ListState } from '../../../../shared/listSlice';

const selectState = (state: RootState): ListState<Member> => state.members;

/* Memoized selectors for the Member feature. */
export const selectMemberItems = createSelector([selectState], (s) => s.items);
export const selectMemberPagination = createSelector([selectState], (s) => s.pagination);
export const selectMemberStatus = createSelector([selectState], (s) => s.status);
export const selectMemberError = createSelector([selectState], (s) => s.error);
export const selectMemberLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectMemberSelected = createSelector([selectState], (s) => s.selected);
export const selectMemberSelectedStatus = createSelector([selectState], (s) => s.selectedStatus);
export const selectMemberMutationStatus = createSelector([selectState], (s) => s.mutationStatus);
export const selectMemberMutationError = createSelector([selectState], (s) => s.mutationError);
