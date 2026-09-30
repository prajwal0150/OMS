import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../../store/store';

const selectState = (state: RootState) => state.superAdmin.organization;

export const selectOrganization = createSelector([selectState], (s) => s.data);
export const selectOrganizationLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectOrganizationError = createSelector([selectState], (s) => s.error);
export const selectOrganizationSaving = createSelector([selectState], (s) => s.saving);
export const selectOrganizationSaveError = createSelector([selectState], (s) => s.saveError);
