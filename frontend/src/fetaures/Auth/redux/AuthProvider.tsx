import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { setSessionExpiredHandler } from '../../../services/api/apiClient';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { ROLE, type AuthUser, type RoleName } from '../../../types';
import { sessionCleared } from './authSlice';
import {
  changePasswordThunk,
  clearAuthError,
  loginThunk,
  logoutThunk,
  restoreSessionThunk,
} from './authThunk';
import { selectMustChangePassword } from './authSelector';

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdministrator: boolean;
  isSuperAdmin: boolean;
  isMemberOnly: boolean;
  role: RoleName | null;
  permissions: string[];
  mustChangePassword: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (input: ChangePasswordPayload) => Promise<boolean>;
  clearError: () => void;
  can: (permission: string) => boolean;
  canAny: (...permissions: string[]) => boolean;
  canAll: (...permissions: string[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Central authorization context. Components ask `can(...)` instead of
 * duplicating role logic - the backend remains the authority.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const status = useAppSelector((state) => state.auth.status);
  const error = useAppSelector((state) => state.auth.error);
  const initialized = useAppSelector((state) => state.auth.initialized);
  const mustChangePassword = useAppSelector(selectMustChangePassword);

  // Restore the session once on first paint.
  useEffect(() => {
    if (!initialized) void dispatch(restoreSessionThunk());
  }, [dispatch, initialized]);

  // When the refresh token is rejected, drop the session and return to /login.
  useEffect(() => {
    setSessionExpiredHandler(() => dispatch(sessionCleared()));
    return () => setSessionExpiredHandler(null);
  }, [dispatch]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await dispatch(loginThunk({ email, password }));
      return loginThunk.fulfilled.match(result);
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    await dispatch(logoutThunk());
  }, [dispatch]);

  const changePassword = useCallback(
    async (input: ChangePasswordPayload) => {
      const result = await dispatch(changePasswordThunk(input));
      return changePasswordThunk.fulfilled.match(result);
    },
    [dispatch],
  );

  const clearError = useCallback(() => {
    void dispatch(clearAuthError());
  }, [dispatch]);

  const value = useMemo<AuthContextValue>(() => {
    const permissions = user?.permissions ?? [];
    return {
      user,
      isAuthenticated: Boolean(user),
      isAdministrator: Boolean(user?.isAdministrator),
      isSuperAdmin: user?.role === ROLE.SUPER_ADMIN,
      isMemberOnly: user?.role === ROLE.MEMBER,
      role: user?.role ?? null,
      permissions,
      mustChangePassword,
      loading: status === 'loading',
      error,
      login,
      logout,
      changePassword,
      clearError,
      can: (permission) => permissions.includes(permission),
      canAny: (...list) => list.some((item) => permissions.includes(item)),
      canAll: (...list) => list.length > 0 && list.every((item) => permissions.includes(item)),
    };
  }, [user, mustChangePassword, status, error, login, logout, changePassword, clearError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
