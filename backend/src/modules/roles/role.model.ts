import mongoose from 'mongoose';
import { ALL_ROLE_NAMES, ROLE_META } from '../../constants/roles';
import type { RoleName } from '../../constants/roles';
import { ALL_PERMISSIONS } from '../../constants/permissions';
import type { Permission } from '../../constants/permissions';
import { RECORD_STATUS } from '../../constants/enums';
import type { RecordStatus } from '../../constants/enums';

export interface RoleDocument extends mongoose.Document {
  name: RoleName;
  label: string;
  description?: string;
  permissions: Permission[];
  rank: number;
  scopeType: 'ORGANIZATION' | 'DISTRICT' | 'UNIT' | 'COMMUNITY' | 'COMMITTEE' | 'SELF';
  status: RecordStatus;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new mongoose.Schema<RoleDocument>(
  {
    name: {
      type: String,
      enum: ALL_ROLE_NAMES,
      required: true,
      unique: true,
      index: true,
    },
    label: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 300 },
    permissions: {
      type: [String],
      enum: ALL_PERMISSIONS,
      default: [],
    },
    rank: { type: Number, default: 99 },
    scopeType: {
      type: String,
      enum: Object.values(ROLE_META).map((meta) => meta.scopeType).filter((value, index, list) => list.indexOf(value) === index),
      default: 'SELF',
    },
    status: {
      type: String,
      enum: Object.values(RECORD_STATUS),
      default: RECORD_STATUS.ACTIVE,
      index: true,
    },
    /** System roles are seeded and cannot be deleted (only extended). */
    isSystem: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'roles' },
);

export const RoleModel = mongoose.model<RoleDocument>('Role', roleSchema);
