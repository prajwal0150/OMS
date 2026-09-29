import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store/store';
import type { MediaItem } from '../../../../types';
import type { ListState } from '../../../../shared/listSlice';

const selectState = (state: RootState): ListState<MediaItem> => state.media;

/* Memoized selectors for the Media feature. */
export const selectMediaItems = createSelector([selectState], (s) => s.items);
export const selectMediaPagination = createSelector([selectState], (s) => s.pagination);
export const selectMediaStatus = createSelector([selectState], (s) => s.status);
export const selectMediaError = createSelector([selectState], (s) => s.error);
export const selectMediaLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectMediaSelected = createSelector([selectState], (s) => s.selected);
export const selectMediaSelectedStatus = createSelector([selectState], (s) => s.selectedStatus);
export const selectMediaMutationStatus = createSelector([selectState], (s) => s.mutationStatus);
export const selectMediaMutationError = createSelector([selectState], (s) => s.mutationError);
