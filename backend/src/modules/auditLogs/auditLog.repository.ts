import { Types } from 'mongoose';
import { BaseRepository } from '../../shared/BaseRepository';
import { AuditLogModel } from './auditLog.model';
import type { AuditLogDocument } from './auditLog.model';

const POPULATE = [
  { path: 'user', select: 'firstName lastName email role' },
  { path: 'district', select: 'name code' },
  { path: 'unit', select: 'name code' },
  { path: 'community', select: 'name code' },
];

export class AuditLogRepository extends BaseRepository<AuditLogDocument> {
  constructor() {
    super(AuditLogModel, {
      searchFields: ['entity', 'entityId', 'description', 'userLabel'],
      allowedSortFields: ['createdAt', 'action', 'entity'],
      defaultSort: 'createdAt',
      populate: POPULATE,
    });
  }

  async write(entry: Record<string, unknown>): Promise<void> {
    await AuditLogModel.create(entry);
  }

  /** Aggregated activity feed used by the dashboard and audit screens. */
  async actionBreakdown(
    match: Record<string, unknown>,
    limit = 10,
  ): Promise<Array<{ action: string; count: number }>> {
    return this.aggregate<{ action: string; count: number }>([
      { $match: match },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $project: { _id: 0, action: '$_id', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
  }

  /** Excludes system generated noise from user facing feeds when required. */
  static exceptActions(actions: string[]): Record<string, unknown> {
    return { action: { $nin: actions } };
  }

  static toObjectId(value?: string | null): Types.ObjectId | undefined {
    return value && Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : undefined;
  }
}

export const auditLogRepository = new AuditLogRepository();
