import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../../store/store';
import type { UserAccount } from '../../../../../types';
import type { ListState } from '../../../../../shared/listSlice';

const selectState = (state: RootState): ListState<UserAccount> => state.superAdmin.administrators;

/* Memoized selectors for the Administrator feature. */
export const selectAdministratorItems = createSelector([selectState], (s) => s.items);
export const selectAdministratorPagination = createSelector([selectState], (s) => s.pagination);
export const selectAdministratorStatus = createSelector([selectState], (s) => s.status);
export const selectAdministratorError = createSelector([selectState], (s) => s.error);
export const selectAdministratorLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectAdministratorSelected = createSelector([selectState], (s) => s.selected);
export const selectAdministratorSelectedStatus = createSelector([selectState], (s) => s.selectedStatus);
export const selectAdministratorMutationStatus = createSelector([selectState], (s) => s.mutationStatus);
export const selectAdministratorMutationError = createSelector([selectState], (s) => s.mutationError);
