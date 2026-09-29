import type { RoleName } from '../constants/roles';
import type { Permission } from '../constants/permissions';
import type { AccountStatus } from '../constants/enums';

/** Scope resolved from the authenticated user — enforced on every query. */
export interface UserScope {
  district?: string | null;
  unit?: string | null;
  community?: string | null;
  committee?: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: RoleName;
  permissions: Permission[];
  member?: string | null;
  district?: string | null;
  unit?: string | null;
  community?: string | null;
  committee?: string | null;
  status: AccountStatus;
  forcePasswordChange: boolean;
  isAdministrator: boolean;
}

export interface JwtPayload {
  sub: string;
  role: RoleName;
  type: 'access' | 'refresh';
  jti: string;
  iat?: number;
  exp?: number;
}

export interface LoginResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  forcePasswordChange: boolean;
}
