import { ROLE_NAMES, ROLE_META } from '../constants/roles';
import type { RoleName } from '../constants/roles';
import type { AuthUser } from '../types/auth';
import { ApiError } from '../utils/ApiError';

export interface ScopeContext {
  district?: string;
  unit?: string;
  community?: string;
  committee?: string;
}

export interface ScopeTarget {
  district?: string | null;
  unit?: string | null;
  community?: string | null;
  committee?: string | null;
}

export const SCOPE_FIELDS = ['district', 'unit', 'community', 'committee'] as const;
export type ScopeField = (typeof SCOPE_FIELDS)[number];

const asId = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && '_id' in (value as Record<string, unknown>)) {
    const nested = (value as { _id?: unknown })._id;
    return nested ? String(nested) : undefined;
  }
  return String(value);
};
export const isSuperAdmin = (user?: AuthUser | null): boolean =>
  user?.role === ROLE_NAMES.SUPER_ADMIN;

export const isDistrictWide = (user?: AuthUser | null): boolean =>
  user?.role === ROLE_NAMES.DISTRICT_ADMIN ||
  user?.role === ROLE_NAMES.DISTRICT_COMMITTEE_MEMBER;

export const isUnitScoped = (user?: AuthUser | null): boolean =>
  user?.role === ROLE_NAMES.UNIT_ADMIN || user?.role === ROLE_NAMES.UNIT_COMMITTEE_MEMBER;

export const requiresAdministrativeAccess = (role: RoleName): boolean =>
  ROLE_META[role].isAdministrator;

/**
 * Extracts the organizational scope of an authenticated user. The ids are
 * normalised through `asId` so a populated sub-document can never leak into a
 * Mongo filter as `[object Object]`.
 */
export const getScopeFromUser = (user: AuthUser): ScopeContext => {
  const district = asId(user.district);
  const unit = asId(user.unit);
  const community = asId(user.community);
  const committee = asId(user.committee);
  return {
    ...(district ? { district } : {}),
    ...(unit ? { unit } : {}),
    ...(community ? { community } : {}),
    ...(committee ? { committee } : {}),
  };
};


/**
 * Builds a Mongo filter fragment that limits a query to the scope of the user.
 * Scope is always enforced at the database level â€” never by filtering in memory.
 */
export const buildScopeFilter = (
  user?: AuthUser | null,
  overrides: Partial<Record<ScopeField, string | null>> = {},
): Record<string, unknown> => {
  if (!user || isSuperAdmin(user)) return {};

  const scope: ScopeContext = getScopeFromUser(user);
  const filter: Record<string, unknown> = {};
  const district = overrides.district ?? scope.district;
  const unit = overrides.unit ?? scope.unit;
  const community = overrides.community ?? scope.community;
  const committee = overrides.committee ?? scope.committee;

  // District level roles (and below) are always restricted to their district.
  if (ROLE_META[user.role].scopeType !== 'ORGANIZATION') {
    if (!district) {
      throw ApiError.forbidden('Your account has no district assigned. Contact an administrator.');
    }
    filter.district = district;
  }
  if (isUnitScoped(user) || user.role === ROLE_NAMES.COMMUNITY_COORDINATOR) {
    if (unit) filter.unit = unit;
  }
  if (user.role === ROLE_NAMES.COMMUNITY_COORDINATOR && community) {
    filter.community = community;
  }
  if (user.role === ROLE_NAMES.COMMITTEE_MEMBER && committee) {
    filter.committee = committee;
  }
  if (user.role === ROLE_NAMES.MEMBER && user.member) {
    filter._id = user.member;
  }
  return filter;
};

/** Throws 403 when the requested target lives outside the caller's scope. */
export const assertWithinScope = (
  user: AuthUser,
  target: ScopeTarget,
  entityLabel = 'record',
): void => {
  if (isSuperAdmin(user)) return;
  if (user.role === ROLE_NAMES.MEMBER) {
    throw ApiError.forbidden('Members cannot access administrative resources');
  }

  const scope = getScopeFromUser(user);
  const compare = (field: ScopeField): void => {
    const scopedValue = scope[field];
    const targetValue = asId(target[field]);
    if (!scopedValue) return;
    if (!targetValue) return; // resolved later by applyScopeDefaults
    if (scopedValue !== targetValue) {
      throw ApiError.forbidden(`You can only manage ${entityLabel} inside your assigned scope`);
    }
  };

  // A district scoped user must never reach into another district.
  const restrictedFields: ScopeField[] =
    user.role === ROLE_NAMES.COMMUNITY_COORDINATOR
      ? ['district', 'unit', 'community']
      : user.role === ROLE_NAMES.COMMITTEE_MEMBER
        ? ['district', 'unit', 'community', 'committee']
        : isUnitScoped(user)
          ? ['district', 'unit']
          : ['district'];

  restrictedFields.forEach(compare);
};

/** Fills missing scope fields on a payload with the caller's scope. */
export const applyScopeDefaults = <TPayload extends Record<string, unknown>>(
  user: AuthUser,
  payload: TPayload,
): TPayload => {
  if (isSuperAdmin(user)) return payload;
  const scope = getScopeFromUser(user);
  const result: Record<string, unknown> = { ...payload };
  for (const field of SCOPE_FIELDS) {
    const value = result[field];
    const isEmpty = value === undefined || value === null || value === '';
    if (isEmpty && scope[field]) {
      result[field] = scope[field];
    }
  }
  return result as TPayload;
};

/** Restricts the requested value to the caller's scope (used by report filters). */
export const narrowScopeParam = (
  user: AuthUser,
  requested: string | undefined,
  field: ScopeField,
): string | undefined => {
  if (isSuperAdmin(user)) return requested;
  const scope = getScopeFromUser(user);
  return scope[field] ?? requested;
};
