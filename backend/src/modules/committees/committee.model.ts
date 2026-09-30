import mongoose from 'mongoose';
import { COMMITTEE_LEVEL, COMMITTEE_POSITION, RECORD_STATUS } from '../../constants/enums';
import type { CommitteeLevel, CommitteePosition, RecordStatus } from '../../constants/enums';

export interface CommitteePositionEntry {
  _id?: mongoose.Types.ObjectId;
  position: CommitteePosition;
  member?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  assignedDate: Date;
  endDate?: Date;
  remarks?: string;
  active: boolean;
}

export interface CommitteeDocument extends mongoose.Document {
  name: string;
  level: CommitteeLevel;
  description?: string;
  district: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  community?: mongoose.Types.ObjectId;
  organization?: mongoose.Types.ObjectId;
  positions: CommitteePositionEntry[];
  startDate?: Date;
  endDate?: Date;
  status: RecordStatus;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const positionSchema = new mongoose.Schema<CommitteePositionEntry>(
  {
    position: { type: String, enum: Object.values(COMMITTEE_POSITION), required: true },
    // Indexed through the compound index declared on the committee schema below.
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    remarks: { type: String, maxlength: 300 },
    active: { type: Boolean, default: true },
  },
  { _id: true },
);

const committeeSchema = new mongoose.Schema<CommitteeDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    level: {
      type: String,
      enum: Object.values(COMMITTEE_LEVEL),
      required: true,
      index: true,
    },
    description: { type: String, maxlength: 1500 },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: true,
      index: true,
    },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
    positions: { type: [positionSchema], default: [] },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: Object.values(RECORD_STATUS),
      default: RECORD_STATUS.ACTIVE,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'committees' },
);

committeeSchema.index({ district: 1, level: 1, status: 1 });
committeeSchema.index({ district: 1, unit: 1, status: 1 });
committeeSchema.index({ district: 1, community: 1, status: 1 });
committeeSchema.index({ 'positions.member': 1 });

export const CommitteeModel = mongoose.model<CommitteeDocument>('Committee', committeeSchema);
