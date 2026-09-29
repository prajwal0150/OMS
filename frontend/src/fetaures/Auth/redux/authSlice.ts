import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { tokenStorage } from '../../../services/api/apiClient';
import type { AuthUser } from '../../../types';
import {
  changePasswordThunk,
  clearAuthError,
  loginThunk,
  logoutThunk,
  restoreSessionThunk,
  type AuthThunkState,
} from './authThunk';

const initialState: AuthThunkState = {
  user: null,
  accessToken: null,
  status: 'idle',
  error: null,
  initialized: false,
  mustChangePassword: false,
  bootstrapError: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionCleared(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'idle';
      state.error = null;
      state.mustChangePassword = false;
      tokenStorage.clear();
    },
    userUpdated(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.mustChangePassword = action.payload.forcePasswordChange;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.mustChangePassword = action.payload.forcePasswordChange;
        state.error = null;
        state.initialized = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload ?? 'Unable to sign in';
        state.user = null;
        state.accessToken = null;
      })
      .addCase(restoreSessionThunk.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(restoreSessionThunk.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
        state.accessToken = tokenStorage.getAccess();
        state.mustChangePassword = action.payload.forcePasswordChange;
        state.initialized = true;
        state.bootstrapError = null;
      })
      .addCase(restoreSessionThunk.rejected, (state, action) => {
        state.status = 'idle';
        state.user = null;
        state.accessToken = null;
        state.initialized = true;
        state.bootstrapError = action.payload ?? null;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = 'idle';
        state.mustChangePassword = false;
        state.error = null;
      })
      .addCase(changePasswordThunk.fulfilled, (state) => {
        state.mustChangePassword = false;
        if (state.user) state.user = { ...state.user, forcePasswordChange: false };
      })
      .addCase(changePasswordThunk.rejected, (state, action) => {
        state.error = action.payload ?? 'Unable to change the password';
      })
      .addCase(clearAuthError.fulfilled, (state) => {
        state.error = null;
      });
  },
});

export const { sessionCleared, userUpdated } = authSlice.actions;
export default authSlice.reducer;
