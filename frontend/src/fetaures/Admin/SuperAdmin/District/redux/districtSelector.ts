import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../../store/store';
import type { District } from '../../../../../types';
import type { ListState } from '../../../../../shared/listSlice';

const selectState = (state: RootState): ListState<District> => state.superAdmin.district;

export const selectDistricts = createSelector([selectState], (s) => s.items);
export const selectDistrictsPagination = createSelector([selectState], (s) => s.pagination);
export const selectDistrictsLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectDistrictsError = createSelector([selectState], (s) => s.error);
export const selectDistrictSelected = createSelector([selectState], (s) => s.selected);
export const selectDistrictMutationStatus = createSelector([selectState], (s) => s.mutationStatus);
export const selectDistrictMutationError = createSelector([selectState], (s) => s.mutationError);
