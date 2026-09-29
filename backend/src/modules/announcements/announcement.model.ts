import mongoose from 'mongoose';
import { RECORD_STATUS, TARGET_TYPE } from '../../constants/enums';
import type { RecordStatus, TargetType } from '../../constants/enums';

export interface AnnouncementDocument extends mongoose.Document {
  title: string;
  content: string;
  image?: string;
  attachment?: mongoose.Types.ObjectId;
  targetType: TargetType;
  district?: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  community?: mongoose.Types.ObjectId;
  committee?: mongoose.Types.ObjectId;
  selectedMembers: mongoose.Types.ObjectId[];
  organization?: mongoose.Types.ObjectId;
  publishDate: Date;
  expiryDate?: Date;
  status: RecordStatus;
  isPublic: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new mongoose.Schema<AnnouncementDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 220, index: true },
    content: { type: String, required: true, maxlength: 6000 },
    image: { type: String },
    attachment: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    targetType: {
      type: String,
      enum: Object.values(TARGET_TYPE),
      default: TARGET_TYPE.DISTRICT,
      index: true,
    },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', index: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    committee: { type: mongoose.Schema.Types.ObjectId, ref: 'Committee', index: true },
    selectedMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
    publishDate: { type: Date, required: true, default: Date.now, index: true },
    expiryDate: { type: Date, index: true },
    status: {
      type: String,
      enum: Object.values(RECORD_STATUS),
      default: RECORD_STATUS.ACTIVE,
      index: true,
    },
    /** Public announcements appear on the public website. */
    isPublic: { type: Boolean, default: false, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'announcements' },
);

announcementSchema.index({ status: 1, publishDate: -1 });
announcementSchema.index({ district: 1, unit: 1, publishDate: -1 });
announcementSchema.index({ targetType: 1, publishDate: -1 });

export const AnnouncementModel = mongoose.model<AnnouncementDocument>(
  'Announcement',
  announcementSchema,
);
