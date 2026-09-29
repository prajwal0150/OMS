import mongoose, { Schema } from 'mongoose';
import { CONTACT_STATUS } from '../../constants/enums';

export interface ContactMessageDocument extends mongoose.Document {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: (typeof CONTACT_STATUS)[keyof typeof CONTACT_STATUS];
  ipAddress?: string;
  userAgent?: string;
  readAt?: Date;
  repliedAt?: Date;
  replyNote?: string;
  assignedTo?: mongoose.Types.ObjectId;
}

const contactMessageSchema = new Schema<ContactMessageDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
      index: true,
    },
    phone: { type: String, trim: true, maxlength: 30 },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    status: {
      type: String,
      enum: Object.values(CONTACT_STATUS),
      default: CONTACT_STATUS.NEW,
      index: true,
    },
    ipAddress: { type: String, trim: true, maxlength: 64 },
    userAgent: { type: String, trim: true, maxlength: 300 },
    readAt: { type: Date },
    repliedAt: { type: Date },
    replyNote: { type: String, trim: true, maxlength: 2000 },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// The admin inbox is almost always filtered by status and newest first.
contactMessageSchema.index({ status: 1, createdAt: -1 });

export const ContactMessage =
  mongoose.models.ContactMessage ??
  mongoose.model<ContactMessageDocument>('ContactMessage', contactMessageSchema);
