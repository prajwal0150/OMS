import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { normalizeApiError } from '../../../../../services/api/apiClient';
import { fetchReportHistory, generateReport, previewReport } from '../services/reportService';
import type { GenerateReportInput, ReportFilters } from '../services/reportService';
import type { ExportFormat, PaginatedResult, PaginationMeta, ReportRecord, ReportType } from '../../../../../types';

export interface ReportsState {
  history: ReportRecord[];
  historyPagination: PaginationMeta | null;
  historyStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  historyError: string | null;
  preview: unknown;
  previewStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  previewError: string | null;
  generating: boolean;
  generateError: string | null;
}

const initialState: ReportsState = {
  history: [],
  historyPagination: null,
  historyStatus: 'idle',
  historyError: null,
  preview: null,
  previewStatus: 'idle',
  previewError: null,
  generating: false,
  generateError: null,
};

export const loadReportHistory = createAsyncThunk<
  { items: ReportRecord[]; meta?: { pagination?: PaginationMeta } },
  Record<string, unknown> | undefined,
  { rejectValue: string }
>('superAdmin.reports/history', async (params, { rejectWithValue }) => {
  try {
    return await fetchReportHistory(params);
  } catch (error) {
    return rejectWithValue(normalizeApiError(error).message);
  }
});

export const loadReportPreview = createAsyncThunk<
  unknown,
  { type: ReportType } & ReportFilters,
  { rejectValue: string }
>('superAdmin.reports/preview', async ({ type, ...filters }, { rejectWithValue }) => {
  try {
    return await previewReport(type, filters);
  } catch (error) {
    return rejectWithValue(normalizeApiError(error).message);
  }
});

export const runReportExport = createAsyncThunk<
  ExportFormat,
  GenerateReportInput,
  { rejectValue: string }
>('superAdmin.reports/export', async (input, { rejectWithValue }) => {
  try {
    await generateReport(input);
    return input.format;
  } catch (error) {
    return rejectWithValue(normalizeApiError(error).message);
  }
});

const reportSlice = createSlice({
  name: 'superAdmin.reports',
  initialState,
  reducers: {
    previewCleared(state) {
      state.preview = null;
      state.previewStatus = 'idle';
      state.previewError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadReportHistory.pending, (state) => {
        state.historyStatus = 'loading';
        state.historyError = null;
      })
      .addCase(loadReportHistory.fulfilled, (state, action) => {
        state.historyStatus = 'succeeded';
        state.history = action.payload.items;
        state.historyPagination = action.payload.meta?.pagination ?? null;
      })
      .addCase(loadReportHistory.rejected, (state, action) => {
        state.historyStatus = 'failed';
        state.historyError = action.payload ?? 'Unable to load report history';
      })
      .addCase(loadReportPreview.pending, (state) => {
        state.previewStatus = 'loading';
        state.previewError = null;
      })
      .addCase(loadReportPreview.fulfilled, (state, action) => {
        state.previewStatus = 'succeeded';
        state.preview = action.payload;
      })
      .addCase(loadReportPreview.rejected, (state, action) => {
        state.previewStatus = 'failed';
        state.previewError = action.payload ?? 'Unable to generate the report preview';
      })
      .addCase(runReportExport.pending, (state) => {
        state.generating = true;
        state.generateError = null;
      })
      .addCase(runReportExport.fulfilled, (state) => {
        state.generating = false;
      })
      .addCase(runReportExport.rejected, (state, action) => {
        state.generating = false;
        state.generateError = action.payload ?? 'The report could not be generated';
      });
  },
});

export const { previewCleared } = reportSlice.actions;
export default reportSlice.reducer;
export type { PaginatedResult };
