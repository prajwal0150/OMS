import type { Request } from 'express';
import type mongoose from 'mongoose';
import { AUDIT_ACTION } from '../constants/enums';
import type { AuthUser } from '../types/auth';
import type { CrudListResult, CrudServiceContract } from './crudController';
import type { BaseRepository } from './BaseRepository';
import { applyScopeDefaults } from './scope';
import { ApiError } from '../utils/ApiError';
import { auditLogService } from '../modules/auditLogs/auditLog.service';

export interface ScopedCrudOptions<TDocument extends mongoose.Document> {
  /** Human label used in error messages, e.g. "Unit". */
  entityLabel: string;
  /** Audit entity name, e.g. "Unit". */
  auditEntity: string;
  repository: BaseRepository<TDocument>;
  /** Translates query params into a Mongo filter (scope + search are added by the repository). */
  buildListFilter?: (query: Record<string, unknown>) => Record<string, unknown>;
  /** Adds server owned fields (scope defaults, parent references, counters). */
  prepareCreate?: (
    user: AuthUser,
    payload: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  /** Guards and normalises updates. */
  prepareUpdate?: (
    user: AuthUser,
    existing: TDocument,
    payload: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  /** Runs before delete (e.g. referential integrity checks). */
  beforeRemove?: (user: AuthUser, existing: TDocument) => Promise<void>;
  /** Extra enrichment for detail responses. */
  enrichDetail?: (user: AuthUser, entity: TDocument) => Promise<Record<string, unknown>>;
  /** Scope defaults are applied from the caller's scope when fields are missing. */
  applyScope?: boolean;
}

/**
 * Reusable scoped CRUD implementation shared by the organizational modules.
 * Controllers stay thin, repositories own persistence, services own the rules.
 */
export class ScopedCrudService<TDocument extends mongoose.Document>
  implements CrudServiceContract<Record<string, unknown>>
{
  constructor(protected readonly options: ScopedCrudOptions<TDocument>) {}

  async list(
    user: AuthUser,
    query: Record<string, unknown>,
  ): Promise<CrudListResult<Record<string, unknown>>> {
    const filter = this.options.buildListFilter ? this.options.buildListFilter(query) : {};
    const { items, meta } = await this.options.repository.list(user, query, filter);
    return { items: items as unknown as Record<string, unknown>[], meta };
  }

  /** Public (unauthenticated) listing restricted by the module supplied filter. */
  async listPublic(
    query: Record<string, unknown>,
    filter: Record<string, unknown> = {},
  ): Promise<CrudListResult<any>> {
    const moduleFilter = this.options.buildListFilter ? this.options.buildListFilter(query) : {};
    const { items, meta } = await this.options.repository.list(null, query, {
      ...moduleFilter,
      ...filter,
    });
    return { items: items as any, meta };
  }

  /** Public detail lookup — no scope applied (used by the public website). */
  async getPublicById(id: string): Promise<any> {
    const entity = await this.options.repository.findById(id);
    if (!entity) throw ApiError.notFound(`${this.options.entityLabel} not found`);
    return entity as any;
  }

  async getById(user: AuthUser, id: string): Promise<Record<string, unknown>> {
    const entity = await this.options.repository.findByIdScoped(
      id,
      user,
      this.options.entityLabel,
    );
    if (!this.options.enrichDetail) return entity as unknown as Record<string, unknown>;
    const extra = await this.options.enrichDetail(user, entity);
    return { ...(entity as unknown as Record<string, unknown>), ...extra };
  }

  async create(
    user: AuthUser,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const prepared = this.options.prepareCreate
      ? await this.options.prepareCreate(user, payload)
      : payload;
    const withScope =
      this.options.applyScope === false ? prepared : applyScopeDefaults(user, prepared);
    const created = await this.options.repository.create({
      ...withScope,
      createdBy: withScope.createdBy ?? user.id,
    });
    return created as unknown as Record<string, unknown>;
  }

  async update(
    user: AuthUser,
    id: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const existing = await this.options.repository.findByIdScoped(
      id,
      user,
      this.options.entityLabel,
    );
    const prepared = this.options.prepareUpdate
      ? await this.options.prepareUpdate(user, existing, payload)
      : payload;
    const updated = await this.options.repository.updateById(id, {
      ...prepared,
      updatedBy: user.id,
    });
    if (!updated) {
      throw new Error(`${this.options.entityLabel} update failed`);
    }
    return updated as unknown as Record<string, unknown>;
  }

  async remove(user: AuthUser, id: string): Promise<void> {
    const existing = await this.options.repository.findByIdScoped(
      id,
      user,
      this.options.entityLabel,
    );
    if (this.options.beforeRemove) await this.options.beforeRemove(user, existing);
    await this.options.repository.deleteById(id);
  }

  /** Shared helper so services can emit audit entries for state transitions. */
  protected async audit(
    action: (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION],
    entityId: string,
    description: string,
    user: AuthUser,
    request?: Request,
  ): Promise<void> {
    await auditLogService.record({
      action,
      entity: this.options.auditEntity,
      entityId,
      description,
      user,
      request,
    });
  }
}
