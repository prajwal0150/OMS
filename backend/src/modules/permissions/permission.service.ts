import { PERMISSION_CATALOG } from '../../constants/permissionCatalog';
import { permissionModuleNames } from '../../constants/rolePermissions';
import type { PaginationMeta } from '../../types/api';
import { PermissionModel } from './permission.model';
import type { PermissionDocument } from './permission.model';

/** Read access to the granular permission catalog. Permissions are seeded and system owned. */
export class PermissionService {
  /** Catalog persisted in the database (falls back to the static catalog before seeding). */
  async list(query: Record<string, unknown>): Promise<{ items: PermissionDocument[]; meta: PaginationMeta }> {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit ?? 100) || 100));
    const module = typeof query.module === 'string' ? query.module : undefined;
    const filter: Record<string, unknown> = module ? { module } : {};

    const [items, total] = await Promise.all([
      PermissionModel.find(filter).sort({ module: 1, key: 1 }).skip((page - 1) * limit).limit(limit),
      PermissionModel.countDocuments(filter),
    ]);

    return {
      items: items as unknown as PermissionDocument[],
      meta: {
        page,
        limit,
        total,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /** Catalog grouped by module — used by the permissions administration screen. */
  async grouped() {
    const persisted = await PermissionModel.find().sort({ module: 1, key: 1 }).lean().exec();
    const source = persisted.length > 0
      ? persisted.map((entry) => ({
          key: entry.key,
          label: entry.label,
          module: entry.module,
          description: entry.description,
        }))
      : PERMISSION_CATALOG.map((entry) => ({
          key: entry.key,
          label: entry.label,
          module: entry.module,
          description: entry.description,
        }));

    return {
      total: source.length,
      modules: permissionModuleNames().map((module) => ({
        module,
        permissions: source.filter((entry) => entry.module === module),
      })),
    };
  }
}

export const permissionService = new PermissionService();