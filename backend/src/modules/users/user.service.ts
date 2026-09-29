import { ROLE_NAMES } from '../../constants/roles';
import type { RoleName } from '../../constants/roles';
import { isSuperAdmin } from '../../shared/scope';
import type { AuthUser } from '../../types/auth';
import { userRepository } from './user.repository';
import { UserModel } from './user.model';

/**
 * Read-only directory of every account in the caller's organizational scope.
 * Administrative accounts are managed through /administrators; this endpoint
 * exists so screens can resolve names/ids (e.g. pickers) without duplicating logic.
 */
export class UserDirectoryService {
  async list(user: AuthUser, query: Record<string, unknown>) {
    const filter: Record<string, unknown> = {};
    if (typeof query.role === 'string' && query.role) filter.role = query.role;
    if (typeof query.status === 'string' && query.status) filter.status = query.status;
    if (typeof query.district === 'string' && query.district) filter.district = query.district;
    if (typeof query.unit === 'string' && query.unit) filter.unit = query.unit;
    return userRepository.list(user, query, filter);
  }

  async getById(user: AuthUser, id: string) {
    return userRepository.findByIdScoped(id, user, 'User account');
  }

  /** Lightweight id/name/type list for pickers and mention fields. */
  async options(user: AuthUser) {
    const limit = 300;
    const filter: Record<string, unknown> = {};
    if (!isSuperAdmin(user)) {
      if (user.district) filter.district = user.district;
      if (user.unit) filter.unit = user.unit;
    }
    const rows = await UserModel.find(filter)
      .select('firstName lastName email role status district unit community')
      .sort({ firstName: 1 })
      .limit(limit)
      .lean()
      .exec();

    return rows.map((row) => ({
      id: String(row._id),
      label: [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email,
      email: row.email,
      role: row.role as RoleName,
      status: row.status,
      district: row.district ? String(row.district) : null,
      unit: row.unit ? String(row.unit) : null,
      community: row.community ? String(row.community) : null,
    }));
  }

  /** Account totals per role inside the caller's scope (used on the settings screen). */
  async roleBreakdown(user: AuthUser) {
    const filter: Record<string, unknown> = {};
    if (!isSuperAdmin(user)) {
      if (user.district) filter.district = user.district;
      if (user.unit) filter.unit = user.unit;
    }
    const rows = await UserModel.aggregate<{ _id: RoleName; count: number }>([
      { $match: filter },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).exec();

    return rows.map((row) => ({ role: row._id, label: row._id, count: row.count }));
  }

  async countSuperAdmins(): Promise<number> {
    return UserModel.countDocuments({ role: ROLE_NAMES.SUPER_ADMIN }).exec();
  }
}

export const userDirectoryService = new UserDirectoryService();