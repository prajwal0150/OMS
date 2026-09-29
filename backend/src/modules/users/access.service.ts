import { ACCOUNT_STATUS } from '../../constants/enums';
import { ROLE_META } from '../../constants/roles';
import type { RoleName } from '../../constants/roles';
import type { Permission } from '../../constants/permissions';
import { roleRepository } from '../roles/role.repository';
import { userRepository } from './user.repository';
import type { UserDocument } from './user.model';
import type { AuthUser } from '../../types/auth';

/**
 * Repository queries populate `member`, `district`, `unit`, `community` and
 * `committee`, so these arrive as sub-documents rather than raw ids. They must
 * be unwrapped before they are used in a Mongo filter, otherwise Mongoose tries
 * to cast a whole object to an ObjectId and throws a CastError.
 */
const toId = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const nested = (value as { _id?: unknown })._id;
    if (nested) return String(nested);
  }
  return String(value);
};

/**
 * Resolves the effective access profile of a user.
 * Permissions are always read from the database (role defaults + explicit grants)
 * so permission changes and deactivations take effect immediately.
 */
export class UserAccessService {
  /** Populated refs arrive as documents, so the identifier must be unwrapped. */
  async buildAuthUser(
    user: Pick<
      UserDocument,
      | '_id'
      | 'email'
      | 'phone'
      | 'firstName'
      | 'lastName'
      | 'role'
      | 'permissions'
      | 'member'
      | 'district'
      | 'unit'
      | 'community'
      | 'committee'
      | 'status'
      | 'forcePasswordChange'
    >,
  ): Promise<AuthUser> {
    const role = await roleRepository.findByName(user.role);
    const rolePermissions = (role?.permissions ?? []) as Permission[];
    const explicit = (user.permissions ?? []) as Permission[];
    const effective = Array.from(new Set<Permission>([...rolePermissions, ...explicit]));

    return {
      id: String(user._id),
      email: user.email,
      phone: user.phone ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      role: user.role,
      permissions: effective,
      member: toId(user.member),
      district: toId(user.district),
      unit: toId(user.unit),
      community: toId(user.community),
      committee: toId(user.committee),
      status: user.status,
      forcePasswordChange: Boolean(user.forcePasswordChange),
      isAdministrator: ROLE_META[user.role as RoleName]?.isAdministrator ?? false,
    };
  }

  /** Loads the access profile for a user id, returning null when unavailable. */
  async getAuthUserById(userId: string): Promise<AuthUser | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;
    return this.buildAuthUser(user);
  }

  /** Used by the authentication middleware on every authenticated request. */
  async loadActiveAuthUser(userId: string): Promise<AuthUser | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;
    if (user.status !== ACCOUNT_STATUS.ACTIVE) return null;
    return this.buildAuthUser(user);
  }

  isAccountUsable(status: string): boolean {
    return status === ACCOUNT_STATUS.ACTIVE;
  }
}

export const userAccessService = new UserAccessService();
