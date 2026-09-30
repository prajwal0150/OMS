import type { Request } from 'express';
import { ACCOUNT_STATUS, AUDIT_ACTION } from '../../constants/enums';
import { ROLE_META, getRoleRank } from '../../constants/roles';
import type { RoleName } from '../../constants/roles';
import { ADMIN_MANAGED_ROLES, REQUIRED_PERMISSIONS } from '../../constants/rolePermissions';
import { PERMISSION_CATALOG } from '../../constants/permissionCatalog';
import type { Permission } from '../../constants/permissions';
import { isValidPermission } from '../../constants/permissions';
import { ApiError } from '../../utils/ApiError';
import { generateTemporaryPassword, hashPassword } from '../../utils/password';
import { applyScopeDefaults, assertWithinScope } from '../../shared/scope';
import { assertParentsInDistrict } from '../../shared/parentScope';
import { refId } from '../../utils/strings';
import { userAccessService } from '../users/access.service';
import { userRepository } from '../users/user.repository';
import { roleRepository } from '../roles/role.repository';
import { auditLogService } from '../auditLogs/auditLog.service';
import type { AuthUser } from '../../types/auth';
import type { AccountStatus } from '../../constants/enums';

export interface CreateAdministratorInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: RoleName;
  password?: string;
  district?: string;
  unit?: string;
  community?: string;
  committee?: string;
  note?: string;
}
const isAdminManagedRole = (role: string): role is RoleName =>
  (ADMIN_MANAGED_ROLES as string[]).includes(role);

/**
 * The only account fields an administrator may change on their own profile.
 * `email`, `role`, `status` and the organizational scope are intentionally
 * absent — those are managed by the Super Admin, never by self service.
 */
const SELF_EDITABLE_ACCOUNT_FIELDS = [
  'firstName',
  'middleName',
  'lastName',
  'phone',
  'profilePhoto',
  'note',
] as const;

/** Scope references are populated documents; unpopulated they are bare ObjectIds. */
const populatedName = (value: unknown): string | null => {
  const doc = value as { name?: unknown } | null | undefined;
  return doc && typeof doc.name === 'string' ? doc.name : null;
};

/**
 * Delegated administration never goes upwards: an account may only manage roles
 * that are at most as broad as its own (lower rank == broader authority).
 */
const assertCanManage = (user: AuthUser, targetRole: string): void => {
  if (getRoleRank(user.role) <= getRoleRank(targetRole as RoleName)) return;
  throw ApiError.forbidden('You cannot manage an account with broader authority than your own');
};


/**
 * Administrative accounts (district/unit administrators and committee staff).
 * Only the Super Admin may create or re-scope them; district administrators may
 * view and maintain accounts inside their own district only.
 */
export class AdministratorService {
  async list(user: AuthUser, query: Record<string, unknown>) {
    const filter: Record<string, unknown> = { role: { $in: ADMIN_MANAGED_ROLES } };
    if (typeof query.role === 'string' && query.role && isAdminManagedRole(query.role)) {
      filter.role = query.role;
    }
    if (typeof query.status === 'string' && query.status) filter.status = query.status;
    const { items, meta } = await userRepository.list(user, query, filter);
    return { items, meta };
  }

  async getById(user: AuthUser, id: string): Promise<Record<string, unknown>> {
    const account = await userRepository.findByIdScoped(id, user, 'Administrator');
    if (!isAdminManagedRole(account.role)) {
      throw ApiError.notFound('Administrator account not found');
    }
    return account as unknown as Record<string, unknown>;
  }

  /** Validates the scope requirements of a target role against the payload. */
  private async resolveScope(
    user: AuthUser,
    role: RoleName,
    input: Partial<CreateAdministratorInput>,
  ): Promise<Record<string, string | undefined>> {
    const withDefaults = applyScopeDefaults(user, input as Record<string, unknown>);
    const scope = {
      district: withDefaults.district ? String(withDefaults.district) : undefined,
      unit: withDefaults.unit ? String(withDefaults.unit) : undefined,
      community: withDefaults.community ? String(withDefaults.community) : undefined,
      committee: withDefaults.committee ? String(withDefaults.committee) : undefined,
    };
    assertWithinScope(user, scope, 'administrator accounts');

    const scopeType = ROLE_META[role]?.scopeType ?? 'SELF';
    if (scopeType !== 'ORGANIZATION' && !scope.district) {
      throw ApiError.badRequest('A district is required for this administrator role');
    }
    if (scopeType === 'UNIT' && !scope.unit) {
      throw ApiError.badRequest('A unit is required for this administrator role');
    }
    if (scopeType === 'COMMUNITY' && !scope.community) {
      throw ApiError.badRequest('A community is required for this administrator role');
    }
    if (scopeType === 'COMMITTEE' && !scope.committee) {
      throw ApiError.badRequest('A committee is required for this administrator role');
    }
    await assertParentsInDistrict(scope.district, {
      unit: scope.unit,
      community: scope.community,
      committee: scope.committee,
    });
    return scope;
  }

  async create(
    user: AuthUser,
    input: CreateAdministratorInput,
    request?: Request,
  ): Promise<{ account: Record<string, unknown>; temporaryPassword: string }> {
    const role = input.role;
    if (!role || !isAdminManagedRole(role)) {
      throw ApiError.badRequest('A valid administrator role is required');
    }

    const email = (input.email ?? '').toLowerCase().trim();
    if (!email) throw ApiError.badRequest('An email address is required');
    const existing = await userRepository.findByEmail(email);
    if (existing) throw ApiError.conflict('An account with this email address already exists');

    const scope = await this.resolveScope(user, role, input);
    const temporaryPassword = input.password ?? generateTemporaryPassword();

    const account = await userRepository.create({
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      email,
      phone: input.phone,
      passwordHash: await hashPassword(temporaryPassword),
      role,
      permissions: [],
      ...(scope.district ? { district: scope.district } : {}),
      ...(scope.unit ? { unit: scope.unit } : {}),
      ...(scope.community ? { community: scope.community } : {}),
      ...(scope.committee ? { committee: scope.committee } : {}),
      status: ACCOUNT_STATUS.ACTIVE,
      forcePasswordChange: true,
      note: input.note,
      createdBy: user.id,
      updatedBy: user.id,
    });

    await auditLogService.record({
      action: AUDIT_ACTION.ADMIN_CREATION,
      entity: 'Administrator',
      entityId: String(account._id),
      description: `Administrator account ${email} created with role ${role}`,
      user,
      request,
      district: scope.district ?? null,
      unit: scope.unit ?? null,
      metadata: { role, scope },
    });

    return {
      account: {
        id: String(account._id),
        email: account.email,
        role: account.role,
        status: account.status,
        forcePasswordChange: account.forcePasswordChange,
      },
      temporaryPassword,
    };
  }

  async update(
    user: AuthUser,
    id: string,
    input: Partial<CreateAdministratorInput>,
    request?: Request,
  ): Promise<Record<string, unknown>> {
    const account = await userRepository.findByIdScoped(id, user, 'Administrator');
    if (!isAdminManagedRole(account.role)) {
      throw ApiError.notFound('Administrator account not found');
    }
    if (String(account._id) === user.id && input.role && input.role !== account.role) {
      throw ApiError.forbidden('You cannot change the role of your own account');
    }
    assertCanManage(user, account.role);

    const nextRole = input.role && isAdminManagedRole(input.role) ? input.role : account.role;
    const next: Record<string, unknown> = { updatedBy: user.id };

    if (input.firstName !== undefined) next.firstName = input.firstName;
    if (input.middleName !== undefined) next.middleName = input.middleName;
    if (input.lastName !== undefined) next.lastName = input.lastName;
    if (input.phone !== undefined) next.phone = input.phone;
    if (input.note !== undefined) next.note = input.note;

    if (input.email && input.email.toLowerCase().trim() !== account.email) {
      const email = input.email.toLowerCase().trim();
      const clash = await userRepository.findByEmail(email);
      if (clash && String(clash._id) !== String(account._id)) {
        throw ApiError.conflict('An account with this email address already exists');
      }
      next.email = email;
    }

    const roleChanged = nextRole !== account.role;
    if (roleChanged) next.role = nextRole;

    const scopeChanged = ['district', 'unit', 'community', 'committee'].some(
      (field) => input[field as keyof CreateAdministratorInput] !== undefined,
    );
    if (roleChanged || scopeChanged) {
      // `account` arrives populated, so every ref is unwrapped with refId().
      const scope = await this.resolveScope(user, nextRole, {
        ...input,
        district:
          input.district !== undefined ? input.district : refId(account.district) ?? undefined,
        unit: input.unit !== undefined ? input.unit : refId(account.unit) ?? undefined,
        community:
          input.community !== undefined ? input.community : refId(account.community) ?? undefined,
        committee:
          input.committee !== undefined ? input.committee : refId(account.committee) ?? undefined,
      });
      const scopeType = ROLE_META[nextRole]?.scopeType ?? 'SELF';
      next.district = scope.district ?? null;
      // A role change drops the parents the new role can no longer use, so a
      // district wide account never keeps a stale unit or community.
      next.unit = scopeType === 'DISTRICT' ? null : (scope.unit ?? null);
      next.community = scopeType === 'COMMUNITY' ? (scope.community ?? null) : null;
      next.committee = scopeType === 'COMMITTEE' ? (scope.committee ?? null) : null;
    }

    const updated = await userRepository.updateById(String(account._id), next);
    if (!updated) throw ApiError.notFound('Administrator account not found');

    await auditLogService.record({
      action: roleChanged ? AUDIT_ACTION.ROLE_CHANGE : AUDIT_ACTION.UPDATE,
      entity: 'Administrator',
      entityId: String(account._id),
      description: roleChanged
        ? `Role of ${account.email} changed from ${account.role} to ${nextRole}`
        : `Administrator account ${account.email} updated`,
      user,
      request,
    });

    return updated as unknown as Record<string, unknown>;
  }

  async setStatus(
    user: AuthUser,
    id: string,
    status: AccountStatus,
    request?: Request,
  ): Promise<Record<string, unknown>> {
    const account = await userRepository.findByIdScoped(id, user, 'Administrator');
    if (!isAdminManagedRole(account.role)) {
      throw ApiError.notFound('Administrator account not found');
    }
    if (String(account._id) === user.id) {
      throw ApiError.forbidden('You cannot change the status of your own account');
    }
    assertCanManage(user, account.role);

    await userRepository.updateById(String(account._id), {
      status,
      updatedBy: user.id,
      ...(status === ACCOUNT_STATUS.ACTIVE ? { loginAttempts: 0, lockedUntil: null } : {}),
    });
    if (status !== ACCOUNT_STATUS.ACTIVE) {
      await userRepository.revokeAllRefreshTokens(String(account._id));
    }

    await auditLogService.record({
      action:
        status === ACCOUNT_STATUS.ACTIVE ? AUDIT_ACTION.ACTIVATION : AUDIT_ACTION.DEACTIVATION,
      entity: 'Administrator',
      entityId: String(account._id),
      description: `Administrator ${account.email} set to ${status}`,
      user,
      request,
    });

    const refreshed = await userAccessService.getAuthUserById(String(account._id));
    return { id: String(account._id), status, user: refreshed };
  }

  /**
   * Hard delete of an administrator account. The account must already be out of
   * service, so a stray click can never take a working unit administrator away.
   */
  async remove(user: AuthUser, id: string, request?: Request): Promise<void> {
    const account = await userRepository.findByIdScoped(id, user, 'Administrator');
    if (!isAdminManagedRole(account.role)) {
      throw ApiError.notFound('Administrator account not found');
    }
    if (String(account._id) === user.id) {
      throw ApiError.forbidden('You cannot delete your own account');
    }
    assertCanManage(user, account.role);
    if (account.status === ACCOUNT_STATUS.ACTIVE) {
      throw ApiError.conflict('Deactivate the account before deleting it');
    }

    await userRepository.revokeAllRefreshTokens(String(account._id));
    await userRepository.deleteById(String(account._id));

    await auditLogService.record({
      action: AUDIT_ACTION.DELETE,
      entity: 'Administrator',
      entityId: String(account._id),
      description: `Administrator account ${account.email} deleted`,
      user,
      request,
    });
  }

  async resetPassword(
    user: AuthUser,
    id: string,
    request?: Request,
  ): Promise<{ temporaryPassword: string }> {
    const account = await userRepository.findByIdScoped(id, user, 'Administrator');
    if (!isAdminManagedRole(account.role)) {
      throw ApiError.notFound('Administrator account not found');
    }
    const temporaryPassword = generateTemporaryPassword();
    await userRepository.setPassword(String(account._id), await hashPassword(temporaryPassword));
    await userRepository.setForcePasswordChange(String(account._id), true);
    await userRepository.revokeAllRefreshTokens(String(account._id));

    await auditLogService.record({
      action: AUDIT_ACTION.PASSWORD_RESET,
      entity: 'Administrator',
      entityId: String(account._id),
      description: `Password reset by ${user.email} for ${account.email}`,
      user,
      request,
    });
    return { temporaryPassword };
  }

  /* ---------- Own account (self service) ---------- */

  /**
   * The signed-in administrator's own account.
   *
   * This is deliberately separate from `getById`: a self-service read must never
   * depend on `admin.account.view`, which a district admin may not hold, and it
   * must never traverse into another account's scope.
   */
  async getOwnProfile(user: AuthUser): Promise<Record<string, unknown>> {
    const account = await userRepository.findById(user.id);
    if (!account) throw ApiError.notFound('Account not found');
    return {
      id: String(account._id),
      firstName: account.firstName,
      middleName: account.middleName ?? '',
      lastName: account.lastName,
      email: account.email,
      phone: account.phone ?? '',
      profilePhoto: account.profilePhoto ?? '',
      note: account.note ?? '',
      role: account.role,
      roleLabel: ROLE_META[account.role]?.label ?? account.role,
      status: account.status,
      lastLogin: account.lastLogin ?? null,
      createdAt: account.createdAt,
      scope: {
        district: populatedName(account.district),
        unit: populatedName(account.unit),
        community: populatedName(account.community),
        committee: populatedName(account.committee),
      },
    };
  }

  /** Self service — role, status and organizational scope stay administrator controlled. */
  async updateOwnProfile(
    user: AuthUser,
    payload: Record<string, unknown>,
    request?: Request,
  ): Promise<Record<string, unknown>> {
    const safe: Record<string, unknown> = {};
    for (const field of SELF_EDITABLE_ACCOUNT_FIELDS) {
      if (payload[field] !== undefined) safe[field] = payload[field];
    }
    const updated = await userRepository.updateById(user.id, {
      ...safe,
      updatedBy: user.id,
    });
    if (!updated) throw ApiError.notFound('Account not found');

    await auditLogService.record({
      action: AUDIT_ACTION.UPDATE,
      entity: 'Administrator',
      entityId: user.id,
      description: `${user.email} updated their own profile`,
      user,
      request,
    });

    return this.getOwnProfile(user);
  }

  /* ---------- Roles & permissions ---------- */

  async listRoles(query: Record<string, unknown> = {}) {
    return roleRepository.list(null, query, {});
  }

  async getRole(id: string): Promise<Record<string, unknown>> {
    const role = await roleRepository.findById(id);
    if (!role) throw ApiError.notFound('Role not found');
    return role as unknown as Record<string, unknown>;
  }

  async updateRolePermissions(
    user: AuthUser,
    roleId: string,
    permissions: string[],
    request?: Request,
  ): Promise<Record<string, unknown>> {
    const invalid = permissions.filter((key) => !isValidPermission(key));
    if (invalid.length > 0) {
      throw ApiError.unprocessable(
        'Unknown permission keys',
        invalid.map((key) => ({ field: 'permissions', message: `Unknown permission: ${key}` })),
      );
    }

    const role = await roleRepository.findById(roleId);
    if (!role) throw ApiError.notFound('Role not found');

    const missingRequired = REQUIRED_PERMISSIONS.filter(
      (required) => !permissions.includes(required),
    );
    if (missingRequired.length > 0) {
      throw ApiError.badRequest(
        `Required permissions cannot be removed: ${missingRequired.join(', ')}`,
      );
    }

    const unique = Array.from(new Set(permissions)) as Permission[];
    const updated = await roleRepository.updatePermissions(role.name, unique);
    if (!updated) throw ApiError.notFound('Role not found');

    await auditLogService.record({
      action: AUDIT_ACTION.PERMISSION_CHANGE,
      entity: 'Role',
      entityId: roleId,
      description: `Permissions of role ${role.name} updated (${unique.length} granted)`,
      user,
      request,
    });

    return updated as unknown as Record<string, unknown>;
  }

  /** Permission catalog grouped by module — powers the role editor UI. */
  permissionCatalog() {
    const grouped = new Map<string, Array<{ key: string; label: string }>>();
    for (const entry of PERMISSION_CATALOG) {
      const bucket = grouped.get(entry.module) ?? [];
      bucket.push({ key: entry.key, label: entry.label });
      grouped.set(entry.module, bucket);
    }
    return Array.from(grouped.entries())
      .map(([module, permissions]) => ({ module, permissions }))
      .sort((a, b) => a.module.localeCompare(b.module));
  }
}

export const administratorService = new AdministratorService();

