import mongoose from 'mongoose';
import { ATTENDANCE_STATUS } from '../../constants/enums';
import type { AttendanceStatus } from '../../constants/enums';

export interface AttendanceDocument extends mongoose.Document {
  member: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
  district: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  community?: mongoose.Types.ObjectId;
  markedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new mongoose.Schema<AttendanceDocument>(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.ABSENT,
      index: true,
    },
    checkIn: { type: String, trim: true, maxlength: 10 },
    checkOut: { type: String, trim: true, maxlength: 10 },
    remarks: { type: String, maxlength: 300 },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: true,
      index: true,
    },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', index: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'attendances' },
);

attendanceSchema.index({ event: 1, member: 1 }, { unique: true });
attendanceSchema.index({ district: 1, unit: 1, date: -1 });
attendanceSchema.index({ district: 1, event: 1, status: 1 });
attendanceSchema.index({ member: 1, date: -1 });

export const AttendanceModel = mongoose.model<AttendanceDocument>('Attendance', attendanceSchema);
