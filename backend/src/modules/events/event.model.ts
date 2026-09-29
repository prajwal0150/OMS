import mongoose from 'mongoose';
import { EVENT_LEVEL, EVENT_STATUS, EVENT_TYPE } from '../../constants/enums';
import type { EventLevel, EventStatus, EventType } from '../../constants/enums';

export interface EventDocument extends mongoose.Document {
  title: string;
  description?: string;
  type: EventType;
  level: EventLevel;
  organizer?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  status: EventStatus;
  coverImage?: string;
  documents: mongoose.Types.ObjectId[];
  district: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  community?: mongoose.Types.ObjectId;
  committee?: mongoose.Types.ObjectId;
  organization?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new mongoose.Schema<EventDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200, index: true },
    description: { type: String, maxlength: 4000 },
    type: {
      type: String,
      enum: Object.values(EVENT_TYPE),
      default: EVENT_TYPE.MEETING,
      index: true,
    },
    level: {
      type: String,
      enum: Object.values(EVENT_LEVEL),
      default: EVENT_LEVEL.DISTRICT,
      index: true,
    },
    organizer: { type: String, trim: true, maxlength: 150 },
    location: { type: String, trim: true, maxlength: 200 },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date },
    startTime: { type: String, trim: true, maxlength: 10 },
    endTime: { type: String, trim: true, maxlength: 10 },
    capacity: { type: Number, min: 0 },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.SCHEDULED,
      index: true,
    },
    coverImage: { type: String },
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: true,
      index: true,
    },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    committee: { type: mongoose.Schema.Types.ObjectId, ref: 'Committee', index: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'events' },
);

eventSchema.index({ district: 1, unit: 1, startDate: -1 });
eventSchema.index({ district: 1, status: 1, startDate: 1 });
eventSchema.index({ district: 1, community: 1, startDate: -1 });
eventSchema.index({ startDate: 1, status: 1 });

export const EventModel = mongoose.model<EventDocument>('Event', eventSchema);
