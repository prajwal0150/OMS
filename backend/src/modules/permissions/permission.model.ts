import mongoose from 'mongoose';

export interface PermissionDocument extends mongoose.Document {
  key: string;
  label: string;
  module: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new mongoose.Schema<PermissionDocument>(
  {
    key: { type: String, required: true, unique: true, index: true, trim: true },
    label: { type: String, required: true, trim: true },
    module: { type: String, required: true, index: true },
    description: { type: String, maxlength: 300 },
    isSystem: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'permissions' },
);

permissionSchema.index({ module: 1, key: 1 });

export const PermissionModel = mongoose.model<PermissionDocument>(
  'Permission',
  permissionSchema,
);
