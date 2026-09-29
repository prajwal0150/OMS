import mongoose from 'mongoose';
import { COMMUNITY_TARGET_GROUP, RECORD_STATUS } from '../../constants/enums';
import type { CommunityTargetGroup, RecordStatus } from '../../constants/enums';

export interface CommunityDocument extends mongoose.Document {
  name: string;
  code: string;
  description?: string;
  targetGroup: CommunityTargetGroup;
  ageGroup?: string;
  district: mongoose.Types.ObjectId;
  /** Optional: a community may operate district wide or inside one unit. */
  unit?: mongoose.Types.ObjectId;
  organization?: mongoose.Types.ObjectId;
  coordinator?: mongoose.Types.ObjectId;
  status: RecordStatus;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const communitySchema = new mongoose.Schema<CommunityDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, trim: true, uppercase: true, index: true },
    description: { type: String, maxlength: 1500 },
    targetGroup: {
      type: String,
      enum: Object.values(COMMUNITY_TARGET_GROUP),
      default: COMMUNITY_TARGET_GROUP.GENERAL,
      index: true,
    },
    ageGroup: { type: String, trim: true, maxlength: 60 },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: true,
      index: true,
    },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
    coordinator: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', index: true },
    status: {
      type: String,
      enum: Object.values(RECORD_STATUS),
      default: RECORD_STATUS.ACTIVE,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'communities' },
);

communitySchema.index({ district: 1, code: 1 }, { unique: true });
communitySchema.index({ district: 1, status: 1 });
communitySchema.index({ district: 1, unit: 1, status: 1 });
communitySchema.index({ district: 1, name: 1 });

export const CommunityModel = mongoose.model<CommunityDocument>('Community', communitySchema);
