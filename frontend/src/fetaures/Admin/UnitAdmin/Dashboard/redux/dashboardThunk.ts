import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { normalizeApiError } from '../../../../../services/api/apiClient';
import { fetchDashboard } from '../services/dashboardService';
import type { DashboardData } from '../../../../../types';

export interface DashboardState {
  data: DashboardData | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: DashboardState = { data: null, status: 'idle', error: null };

export const loadDashboard = createAsyncThunk<
  DashboardData,
  Record<string, unknown> | undefined,
  { rejectValue: string }
>('unitAdmin.dashboard/load', async (params, { rejectWithValue }) => {
  try {
    return await fetchDashboard(params);
  } catch (error) {
    return rejectWithValue(normalizeApiError(error).message);
  }
});

const dashboardSlice = createSlice({
  name: 'unitAdmin.dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadDashboard.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadDashboard.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(loadDashboard.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unable to load dashboard data';
      });
  },
});

export default dashboardSlice.reducer;
