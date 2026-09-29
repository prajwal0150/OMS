import mongoose from 'mongoose';
import { RECORD_STATUS } from '../../constants/enums';
import type { RecordStatus } from '../../constants/enums';

export interface DistrictDocument extends mongoose.Document {
  name: string;
  code: string;
  province: string;
  country: string;
  description?: string;
  organization?: mongoose.Types.ObjectId;
  contact: {
    phone?: string;
    email?: string;
    address?: string;
  };
  status: RecordStatus;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const districtSchema = new mongoose.Schema<DistrictDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
    province: { type: String, trim: true, default: 'Koshi Province' },
    country: { type: String, trim: true, default: 'Nepal' },
    description: { type: String, maxlength: 1500 },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
    contact: {
      phone: { type: String, trim: true, maxlength: 30 },
      email: { type: String, lowercase: true, trim: true },
      address: { type: String, trim: true, maxlength: 300 },
    },
    status: {
      type: String,
      enum: Object.values(RECORD_STATUS),
      default: RECORD_STATUS.ACTIVE,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'districts',
    toJSON: { virtuals: true },
  },
);

districtSchema.index({ status: 1, name: 1 });

export const DistrictModel = mongoose.model<DistrictDocument>('District', districtSchema);
