import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../../store/store';
import type { Announcement } from '../../../../../types';
import type { ListState } from '../../../../../shared/listSlice';

const selectState = (state: RootState): ListState<Announcement> => state.districtAdmin.announcements;

/* Memoized selectors for the Announcement feature. */
export const selectAnnouncementItems = createSelector([selectState], (s) => s.items);
export const selectAnnouncementPagination = createSelector([selectState], (s) => s.pagination);
export const selectAnnouncementStatus = createSelector([selectState], (s) => s.status);
export const selectAnnouncementError = createSelector([selectState], (s) => s.error);
export const selectAnnouncementLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectAnnouncementSelected = createSelector([selectState], (s) => s.selected);
export const selectAnnouncementSelectedStatus = createSelector([selectState], (s) => s.selectedStatus);
export const selectAnnouncementMutationStatus = createSelector([selectState], (s) => s.mutationStatus);
export const selectAnnouncementMutationError = createSelector([selectState], (s) => s.mutationError);
