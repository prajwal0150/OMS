import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { normalizeApiError } from '../../../../services/api/apiClient';
import { fetchOrganization, updateOrganization } from '../services/organizationService';
import type { Organization } from '../../../../types';

export interface OrganizationState {
  data: Organization | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  saving: boolean;
  saveError: string | null;
}

const initialState: OrganizationState = {
  data: null,
  status: 'idle',
  error: null,
  saving: false,
  saveError: null,
};

export const loadOrganization = createAsyncThunk<Organization, void, { rejectValue: string }>(
  'organization/load',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchOrganization();
    } catch (error) {
      return rejectWithValue(normalizeApiError(error).message);
    }
  },
);

export const saveOrganization = createAsyncThunk<Organization, Partial<Organization>, { rejectValue: string }>(
  'organization/save',
  async (payload, { rejectWithValue }) => {
    try {
      return await updateOrganization(payload);
    } catch (error) {
      return rejectWithValue(normalizeApiError(error).message);
    }
  },
);

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadOrganization.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadOrganization.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(loadOrganization.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unable to load the organization profile';
      })
      .addCase(saveOrganization.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(saveOrganization.fulfilled, (state, action) => {
        state.saving = false;
        state.data = action.payload;
      })
      .addCase(saveOrganization.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload ?? 'Unable to save the organization profile';
      });
  },
});

export default organizationSlice.reducer;
