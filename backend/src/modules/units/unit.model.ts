import mongoose from 'mongoose';
import { RECORD_STATUS } from '../../constants/enums';
import type { RecordStatus } from '../../constants/enums';

export interface UnitDocument extends mongoose.Document {
  name: string;
  code: string;
  description?: string;
  location?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  district: mongoose.Types.ObjectId;
  organization?: mongoose.Types.ObjectId;
  status: RecordStatus;
  establishedDate?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const unitSchema = new mongoose.Schema<UnitDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, trim: true, uppercase: true, index: true },
    description: { type: String, maxlength: 1500 },
    location: { type: String, trim: true, maxlength: 150 },
    contactPerson: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 30, index: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true, maxlength: 300 },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: true,
      index: true,
    },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
    status: {
      type: String,
      enum: Object.values(RECORD_STATUS),
      default: RECORD_STATUS.ACTIVE,
      index: true,
    },
    establishedDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'units' },
);

unitSchema.index({ district: 1, name: 1 }, { unique: true });
unitSchema.index({ district: 1, code: 1 }, { unique: true });
unitSchema.index({ district: 1, status: 1 });

export const UnitModel = mongoose.model<UnitDocument>('Unit', unitSchema);
