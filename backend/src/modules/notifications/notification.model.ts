import mongoose from 'mongoose';
import { NOTIFICATION_TYPE } from '../../constants/enums';
import type { NotificationType } from '../../constants/enums';

export interface NotificationDocument extends mongoose.Document {
  recipient: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  entity?: string;
  entityId?: string;
  district?: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  community?: mongoose.Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<NotificationDocument>(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      default: NOTIFICATION_TYPE.SYSTEM,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, maxlength: 600 },
    link: { type: String, maxlength: 300 },
    entity: { type: String, maxlength: 60 },
    entityId: { type: String, maxlength: 60 },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', index: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'notifications' },
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export const NotificationModel = mongoose.model<NotificationDocument>(
  'Notification',
  notificationSchema,
);
