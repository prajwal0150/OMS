import type { Request } from 'express';
import type { AuditAction } from '../../constants/enums';
import type { AuthUser } from '../../types/auth';
import type { CrudListResult } from '../../shared/crudController';
import { logger } from '../../utils/logger';
import { buildDateRange, combineFilters, readEnum } from '../../shared/queryFilters';
import { AUDIT_ACTION } from '../../constants/enums';
import { auditLogRepository } from './auditLog.repository';
import type { AuditLogDocument } from './auditLog.model';
import { buildScopeFilter } from '../../shared/scope';

export interface AuditEntryInput {
  action: AuditAction;
  entity: string;
  entityId?: string;
  description?: string;
  user?: AuthUser | null;
  district?: string | null;
  unit?: string | null;
  community?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request;
}

/**
 * Writes audit trail entries. Auditing must never break a business operation,
 * therefore failures are logged and swallowed.
 */
export class AuditLogService {
  private clientIp(req?: Request): string | undefined {
    if (!req) return undefined;
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0]?.trim();
    }
    return req.ip ?? undefined;
  }

  async record(input: AuditEntryInput): Promise<void> {
    try {
      const user = input.user ?? input.request?.user ?? null;
      await auditLogRepository.write({
        user: user?.id,
        userLabel: user
          ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email
          : undefined,
        userRole: user?.role,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ? String(input.entityId) : undefined,
        description: input.description,
        district: input.district ?? user?.district ?? undefined,
        unit: input.unit ?? user?.unit ?? undefined,
        community: input.community ?? user?.community ?? undefined,
        ipAddress: this.clientIp(input.request),
        userAgent: input.request?.headers['user-agent']?.slice(0, 300),
        requestId: input.request?.requestId,
        metadata: input.metadata,
      });
    } catch (error) {
      logger.warn('Failed to write audit log entry', error);
    }
  }

  /** Convenience wrapper for controllers that already have a request object. */
  async recordFromRequest(
    req: Request,
    action: AuditAction,
    entity: string,
    entityId?: string,
    description?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.record({
      action,
      entity,
      entityId,
      description,
      request: req,
      user: req.user ?? null,
      metadata,
    });
  }

  async list(user: AuthUser, query: Record<string, unknown>): Promise<CrudListResult<AuditLogDocument>> {
    const action = readEnum(query.action, Object.values(AUDIT_ACTION));
    const dateRange = buildDateRange(query.from, query.to, { endOfDay: true });
    const filter = combineFilters(
      buildScopeFilter(user),
      action ? { action } : {},
      typeof query.entity === 'string' && query.entity ? { entity: query.entity } : {},
      typeof query.actor === 'string' && query.actor ? { user: query.actor } : {},
      Object.keys(dateRange).length > 0 ? { createdAt: dateRange } : {},
    );

    const result = await auditLogRepository.list(user, query, filter as Record<string, unknown>);
    return { items: result.items, meta: result.meta };
  }

  async getById(user: AuthUser, id: string): Promise<AuditLogDocument> {
    return auditLogRepository.findByIdScoped(id, user, 'Audit log entry');
  }

  async summary(user: AuthUser, query: Record<string, unknown>) {
    const match = combineFilters(
      buildScopeFilter(user),
      Object.keys(buildDateRange(query.from, query.to)).length > 0
        ? { createdAt: buildDateRange(query.from, query.to, { endOfDay: true }) }
        : {},
    );
    const actions = await auditLogRepository.actionBreakdown(match, 12);
    const total = await auditLogRepository.count(user);
    return { total, actions };
  }
}

export const auditLogService = new AuditLogService();
