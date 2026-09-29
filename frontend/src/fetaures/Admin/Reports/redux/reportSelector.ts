import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store/store';

const selectState = (state: RootState) => state.reports;

export const selectReportHistory = createSelector([selectState], (s) => s.history);
export const selectReportHistoryPagination = createSelector([selectState], (s) => s.historyPagination);
export const selectReportHistoryLoading = createSelector([selectState], (s) => s.historyStatus === 'loading');
export const selectReportPreview = createSelector([selectState], (s) => s.preview);
export const selectReportPreviewLoading = createSelector([selectState], (s) => s.previewStatus === 'loading');
export const selectReportPreviewError = createSelector([selectState], (s) => s.previewError);
export const selectReportGenerating = createSelector([selectState], (s) => s.generating);
export const selectReportGenerateError = createSelector([selectState], (s) => s.generateError);
