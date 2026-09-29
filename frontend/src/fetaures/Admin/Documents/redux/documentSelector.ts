import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store/store';
import type { DocumentFile } from '../../../../types';
import type { ListState } from '../../../../shared/listSlice';

const selectState = (state: RootState): ListState<DocumentFile> => state.documents;

/* Memoized selectors for the Document feature. */
export const selectDocumentItems = createSelector([selectState], (s) => s.items);
export const selectDocumentPagination = createSelector([selectState], (s) => s.pagination);
export const selectDocumentStatus = createSelector([selectState], (s) => s.status);
export const selectDocumentError = createSelector([selectState], (s) => s.error);
export const selectDocumentLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectDocumentSelected = createSelector([selectState], (s) => s.selected);
export const selectDocumentSelectedStatus = createSelector([selectState], (s) => s.selectedStatus);
export const selectDocumentMutationStatus = createSelector([selectState], (s) => s.mutationStatus);
export const selectDocumentMutationError = createSelector([selectState], (s) => s.mutationError);
