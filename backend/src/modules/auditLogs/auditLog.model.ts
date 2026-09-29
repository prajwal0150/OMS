import mongoose from 'mongoose';
import { AUDIT_ACTION } from '../../constants/enums';
import type { AuditAction } from '../../constants/enums';

export interface AuditLogDocument extends mongoose.Document {
  user?: mongoose.Types.ObjectId;
  userLabel?: string;
  userRole?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  description?: string;
  district?: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  community?: mongoose.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new mongoose.Schema<AuditLogDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    userLabel: { type: String, maxlength: 160 },
    userRole: { type: String, maxlength: 40 },
    action: {
      type: String,
      enum: Object.values(AUDIT_ACTION),
      required: true,
      index: true,
    },
    entity: { type: String, required: true, index: true, maxlength: 60 },
    entityId: { type: String, index: true },
    description: { type: String, maxlength: 400 },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', index: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    ipAddress: { type: String, maxlength: 60 },
    userAgent: { type: String, maxlength: 300 },
    requestId: { type: String, maxlength: 60 },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'audit_logs',
  },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ district: 1, unit: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, action: 1, createdAt: -1 });

export const AuditLogModel = mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema);
