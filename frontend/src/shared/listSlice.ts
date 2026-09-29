import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Draft } from 'immer';
import type { PaginationMeta } from '../types';
import { normalizeApiError } from '../services/api/apiClient';

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface ListState<TItem> {
  items: TItem[];
  pagination: PaginationMeta | null;
  status: RequestStatus;
  error: string | null;
  /** Record currently open in a details page or drawer. */
  selected: TItem | null;
  selectedStatus: RequestStatus;
  mutationStatus: RequestStatus;
  mutationError: string | null;
}

export const createListInitialState = <TItem>(): ListState<TItem> => ({
  items: [],
  pagination: null,
  status: 'idle',
  error: null,
  selected: null,
  selectedStatus: 'idle',
  mutationStatus: 'idle',
  mutationError: null,
});

export interface ListResult<TItem> {
  items: TItem[];
  meta?: { pagination?: PaginationMeta };
}

export interface CreateListSliceOptions<TItem> {
  fetchList: (params: Record<string, unknown>) => Promise<ListResult<TItem>>;
  fetchOne?: (id: string) => Promise<TItem>;
}

/**
 * Factory for the many "paginated list + detail + mutations" features.
 * Every feature slice under `fetaures/**\/redux/` is built from this so the
 * request-status contract (`idle | loading | succeeded | failed`) is identical.
 */
export function createListSlice<TItem>(
  sliceName: string,
  options: CreateListSliceOptions<TItem>,
) {
  const fetchList = createAsyncThunk<ListResult<TItem>, Record<string, unknown>, { rejectValue: string }>(
    `${sliceName}/fetchList`,
    async (params, { rejectWithValue }) => {
      try {
        return await options.fetchList(params);
      } catch (error) {
        return rejectWithValue(normalizeApiError(error).message);
      }
    },
  );

  const fetchOne = options.fetchOne
    ? createAsyncThunk<TItem, string, { rejectValue: string }>(
        `${sliceName}/fetchOne`,
        async (id, { rejectWithValue }) => {
          try {
            return await options.fetchOne!(id);
          } catch (error) {
            return rejectWithValue(normalizeApiError(error).message);
          }
        },
      )
    : null;

  const slice = createSlice({
    name: sliceName,
    initialState: createListInitialState<TItem>(),
    reducers: {
      mutationStarted(state) {
        state.mutationStatus = 'loading';
        state.mutationError = null;
      },
      mutationSucceeded(state) {
        state.mutationStatus = 'succeeded';
        state.mutationError = null;
      },
      mutationFailed(state, action: { payload: string }) {
        state.mutationStatus = 'failed';
        state.mutationError = action.payload;
      },
      selectedCleared(state) {
        state.selected = null;
        state.selectedStatus = 'idle';
      },
      // `state` is an Immer draft here, so the payload is cast back to the
      // draft type before it is stored.
      upserted(state, action: { payload: TItem }) {
        const item = action.payload as Draft<TItem>;
        const id = (item as { _id?: string })._id;
        const index = state.items.findIndex((entry) => (entry as { _id?: string })._id === id);
        if (index >= 0) state.items[index] = item;
        else state.items = [item, ...state.items];
        state.selected = item as (typeof state)['selected'];
      },
      removed(state, action: { payload: string }) {
        state.items = state.items.filter((entry) => (entry as { _id?: string })._id !== action.payload);
        if (state.selected && (state.selected as { _id?: string })._id === action.payload) {
          state.selected = null;
        }
      },
      reset() {
        return createListInitialState<TItem>();
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchList.pending, (state) => {
          state.status = 'loading';
          state.error = null;
        })
        .addCase(fetchList.fulfilled, (state, action) => {
          state.status = 'succeeded';
          state.items = action.payload.items as Draft<TItem>[];
          state.pagination = action.payload.meta?.pagination ?? null;
        })
        .addCase(fetchList.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload ?? 'Unable to load records';
        });

      if (fetchOne) {
        builder
          .addCase(fetchOne.pending, (state) => {
            state.selectedStatus = 'loading';
          })
          .addCase(fetchOne.fulfilled, (state, action) => {
            state.selectedStatus = 'succeeded';
            state.selected = action.payload as (typeof state)['selected'];
          })
          .addCase(fetchOne.rejected, (state, action) => {
            state.selectedStatus = 'failed';
            state.selected = null;
            state.mutationError = action.payload ?? 'Unable to load the record';
          });
      }
    },
  });

  return {
    fetchList,
    fetchOne,
    reducer: slice.reducer,
    actions: slice.actions,
  };
}
