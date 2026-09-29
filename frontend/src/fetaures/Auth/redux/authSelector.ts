import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../store/store';
import { PERMISSIONS, ROLE, type RoleName } from '../../../types';
import type { AuthUser } from '../../../types';

/* Memoized selectors - never derive auth data inline in components. */

export const selectAuth = (state: RootState) => state.auth;
export const selectCurrentUser = (state: RootState): AuthUser | null => state.auth.user;
export const selectIsAuthenticated = (state: RootState): boolean => Boolean(state.auth.user);
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState): string | null => state.auth.error;
export const selectAuthInitialized = (state: RootState): boolean => state.auth.initialized;
export const selectMustChangePassword = (state: RootState): boolean => state.auth.mustChangePassword;

export const selectCurrentRole = (state: RootState): RoleName | null => state.auth.user?.role ?? null;

export const selectPermissions = createSelector(
  [(state: RootState) => state.auth.user],
  (user): string[] => user?.permissions ?? [],
);

export const selectIsSuperAdmin = createSelector(
  [selectCurrentRole],
  (role) => role === ROLE.SUPER_ADMIN,
);

export const selectIsAdministrator = createSelector(
  [(state: RootState) => state.auth.user],
  (user) => Boolean(user?.isAdministrator),
);

export const selectDisplayName = createSelector(
  [(state: RootState) => state.auth.user],
  (user) => {
    if (!user) return 'Guest';
    const joined = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return joined || user.email;
  },
);

export const selectInitials = createSelector([selectDisplayName], (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join(''),
);

/** True when the signed-in account holds at least one of the given permissions. */
export const selectHasPermission = (permission: string) =>
  createSelector([selectPermissions], (permissions) => permissions.includes(permission));

export const selectHasAnyPermission = (...permissions: string[]) =>
  createSelector([selectPermissions], (granted) => permissions.some((item) => granted.includes(item)));

export const selectHasAllPermissions = (...permissions: string[]) =>
  createSelector([selectPermissions], (granted) => permissions.every((item) => granted.includes(item)));

/* ---- Organization scope helpers (UX only - the backend is authoritative) ---- */

export const selectScope = createSelector([(state: RootState) => state.auth.user], (user) => ({
  district: user?.district ?? null,
  unit: user?.unit ?? null,
  community: user?.community ?? null,
  committee: user?.committee ?? null,
}));

export const selectCanManageMembers = createSelector([selectPermissions], (permissions) =>
  permissions.some((item) =>
    [
      PERMISSIONS.MEMBER_CREATE,
      PERMISSIONS.MEMBER_UPDATE,
      PERMISSIONS.MEMBER_DELETE,
      PERMISSIONS.MEMBER_VIEW,
    ].includes(item as never),
  ),
);
