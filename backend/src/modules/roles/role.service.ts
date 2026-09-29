import { PERMISSION_CATALOG } from '../../constants/permissionCatalog';
import { permissionModuleNames } from '../../constants/rolePermissions';
import type { Permission } from '../../constants/permissions';
import type { RoleName } from '../../constants/roles';
import type { PaginationMeta } from '../../types/api';
import { roleRepository } from './role.repository';

export interface RoleListItem {
  _id: string;
  name: RoleName;
  label: string;
  description?: string;
  permissions: Permission[];
  permissionCount: number;
  rank: number;
  scopeType: string;
  status: string;
  isSystem: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PermissionModuleGroup {
  module: string;
  permissions: Array<{ key: string; label: string; description?: string }>;
}

export interface PermissionCatalog {
  total: number;
  modules: PermissionModuleGroup[];
}

/** Read access to the database backed roles and to the permission catalog. */
export class RoleService {
  async list(
    query: Record<string, unknown>,
  ): Promise<{ items: RoleListItem[]; meta: PaginationMeta }> {
    const { items, meta } = await roleRepository.list(null, query);
    return {
      items: items.map((role) => ({
        _id: String(role._id),
        name: role.name,
        label: role.label,
        description: role.description,
        permissions: role.permissions,
        permissionCount: role.permissions.length,
        rank: role.rank,
        scopeType: role.scopeType,
        status: role.status,
        isSystem: role.isSystem,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
      meta,
    };
  }

  /** Resolves a role by Mongo id or by its stable role name. */
  async getById(id: string): Promise<RoleListItem | null> {
    if (!id) return null;
    const byId = await roleRepository.findOne({ _id: id });
    const role = byId ?? (await roleRepository.findByName(id));
    if (!role) return null;
    return {
      _id: String(role._id),
      name: role.name,
      label: role.label,
      description: role.description,
      permissions: role.permissions,
      permissionCount: role.permissions.length,
      rank: role.rank,
      scopeType: role.scopeType,
      status: role.status,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  /** Full permission catalog grouped by module, used by the roles screen. */
  catalog(): PermissionCatalog {
    const modules: PermissionModuleGroup[] = permissionModuleNames().map((module) => ({
      module,
      permissions: PERMISSION_CATALOG.filter((entry) => entry.module === module).map((entry) => ({
        key: entry.key,
        label: entry.label,
        description: entry.description,
      })),
    }));
    return { total: PERMISSION_CATALOG.length, modules };
  }
}

export const roleService = new RoleService();