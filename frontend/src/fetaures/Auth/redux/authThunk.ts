import { createAsyncThunk } from '@reduxjs/toolkit';
import apiClient, { normalizeApiError, tokenStorage, unwrap } from '../../../services/api/apiClient';
import type { AuthUser, Session } from '../../../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthThunkState {
  user: AuthUser | null;
  accessToken: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  error: string | null;
  initialized: boolean;
  /** True while the account must set a new password before using the app. */
  mustChangePassword: boolean;
  bootstrapError: string | null;
}

/** Signs in with email + password. There is no public registration anywhere. */
export const loginThunk = createAsyncThunk<Session, LoginPayload, { rejectValue: string }>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<{ data: Session }>('/auth/login', payload);
      const session = unwrap(response);
      tokenStorage.set(session.accessToken, session.refreshToken);
      return session;
    } catch (error) {
      return rejectWithValue(normalizeApiError(error).message);
    }
  },
);

/** Restores the session on page load using the persisted access token. */
export const restoreSessionThunk = createAsyncThunk<
  AuthUser,
  void,
  { rejectValue: string }
>('auth/restore', async (_arg, { rejectWithValue }) => {
  if (!tokenStorage.getAccess()) return rejectWithValue('No stored session');
  try {
    const response = await apiClient.get<{ data: AuthUser }>('/auth/me');
    return unwrap(response);
  } catch (error) {
    tokenStorage.clear();
    return rejectWithValue(normalizeApiError(error).message);
  }
});

export const logoutThunk = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Signing out locally must always succeed, even if the network fails.
    } finally {
      tokenStorage.clear();
    }
    return Promise.resolve();
  },
);

/** Completes the forced password change required on first sign-in. */
export const changePasswordThunk = createAsyncThunk<
  { forcePasswordChange: false },
  { currentPassword: string; newPassword: string; confirmPassword?: string },
  { rejectValue: string }
>('auth/changePassword', async (payload, { rejectWithValue }) => {
  try {
    const response = await apiClient.post<{ data: { forcePasswordChange: false } }>(
      '/auth/change-password',
      payload,
    );
    return unwrap(response);
  } catch (error) {
    return rejectWithValue(normalizeApiError(error).message);
  }
});

/** Clears a previous authentication error (used when a form is re-submitted). */
export const clearAuthError = createAsyncThunk<void>('auth/clearError', async () => undefined);
