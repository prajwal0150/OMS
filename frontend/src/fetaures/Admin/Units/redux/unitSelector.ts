import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store/store';
import type { Unit } from '../../../../types';
import type { ListState } from '../../../../shared/listSlice';

const selectState = (state: RootState): ListState<Unit> => state.units;

/* Memoized selectors for the Unit feature. */
export const selectUnitItems = createSelector([selectState], (s) => s.items);
export const selectUnitPagination = createSelector([selectState], (s) => s.pagination);
export const selectUnitStatus = createSelector([selectState], (s) => s.status);
export const selectUnitError = createSelector([selectState], (s) => s.error);
export const selectUnitLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectUnitSelected = createSelector([selectState], (s) => s.selected);
export const selectUnitSelectedStatus = createSelector([selectState], (s) => s.selectedStatus);
export const selectUnitMutationStatus = createSelector([selectState], (s) => s.mutationStatus);
export const selectUnitMutationError = createSelector([selectState], (s) => s.mutationError);
