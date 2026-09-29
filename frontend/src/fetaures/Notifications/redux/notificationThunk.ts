import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { normalizeApiError } from '../../../services/api/apiClient';
import {
  deleteNotification,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService';
import type { NotificationItem, PaginationMeta } from '../../../types';

export interface NotificationsState {
  items: NotificationItem[];
  pagination: PaginationMeta | null;
  unread: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  pagination: null,
  unread: 0,
  status: 'idle',
  error: null,
};

export const loadNotifications = createAsyncThunk<
  { items: NotificationItem[]; meta?: { pagination?: PaginationMeta } },
  Record<string, unknown> | undefined,
  { rejectValue: string }
>('notifications/load', async (params, { rejectWithValue }) => {
  try {
    return await fetchNotifications(params);
  } catch (error) {
    return rejectWithValue(normalizeApiError(error).message);
  }
});

export const loadUnreadCount = createAsyncThunk<number, void, { rejectValue: string }>(
  'notifications/unread',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchUnreadCount();
    } catch (error) {
      return rejectWithValue(normalizeApiError(error).message);
    }
  },
);

export const markRead = createAsyncThunk<string, string, { rejectValue: string }>(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await markNotificationRead(id);
      return id;
    } catch (error) {
      return rejectWithValue(normalizeApiError(error).message);
    }
  },
);

export const markAllRead = createAsyncThunk<number, void, { rejectValue: string }>(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      return await markAllNotificationsRead();
    } catch (error) {
      return rejectWithValue(normalizeApiError(error).message);
    }
  },
);

export const removeNotification = createAsyncThunk<string, string, { rejectValue: string }>(
  'notifications/remove',
  async (id, { rejectWithValue }) => {
    try {
      await deleteNotification(id);
      return id;
    } catch (error) {
      return rejectWithValue(normalizeApiError(error).message);
    }
  },
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.pagination = action.payload.meta?.pagination ?? null;
      })
      .addCase(loadNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unable to load notifications';
      })
      .addCase(loadUnreadCount.fulfilled, (state, action) => {
        state.unread = action.payload;
      })
      .addCase(markRead.fulfilled, (state, action) => {
        const item = state.items.find((entry) => entry._id === action.payload);
        if (item && !item.isRead) {
          item.isRead = true;
          item.readAt = new Date().toISOString();
          state.unread = Math.max(0, state.unread - 1);
        }
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.items = state.items.map((item) => ({ ...item, isRead: true }));
        state.unread = 0;
      })
      .addCase(removeNotification.fulfilled, (state, action) => {
        const removed = state.items.find((entry) => entry._id === action.payload);
        if (removed && !removed.isRead) state.unread = Math.max(0, state.unread - 1);
        state.items = state.items.filter((entry) => entry._id !== action.payload);
      });
  },
});

export default notificationSlice.reducer;
