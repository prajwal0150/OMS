import { z } from 'zod';
import { ATTENDANCE_STATUS } from '../../constants/enums';
import {
  dateOnlySchema,
  objectIdSchema,
  optionalString,
  paginationSchema,
} from '../../shared/validation';

export const attendanceListQuerySchema = paginationSchema.extend({
  event: optionalString(40),
  member: optionalString(40),
  unit: optionalString(40),
  community: optionalString(40),
  status: z.enum(Object.values(ATTENDANCE_STATUS) as [string, ...string[]]).optional(),
  from: optionalString(40),
  to: optionalString(40),
});

export const attendanceRecordSchema = z.object({
  member: objectIdSchema,
  status: z.enum(Object.values(ATTENDANCE_STATUS) as [string, ...string[]]),
  checkIn: optionalString(10),
  checkOut: optionalString(10),
  remarks: optionalString(300),
});

export const bulkAttendanceSchema = z.object({
  event: objectIdSchema,
  date: dateOnlySchema,
  records: z.array(attendanceRecordSchema).min(1, 'At least one attendance record is required'),
});

export const individualAttendanceSchema = z.object({
  member: objectIdSchema,
  event: objectIdSchema,
  date: dateOnlySchema,
  status: z.enum(Object.values(ATTENDANCE_STATUS) as [string, ...string[]]),
  checkIn: optionalString(10),
  checkOut: optionalString(10),
  remarks: optionalString(300),
});

export const updateAttendanceSchema = z.object({
  status: z.enum(Object.values(ATTENDANCE_STATUS) as [string, ...string[]]).optional(),
  date: dateOnlySchema.optional(),
  checkIn: optionalString(10),
  checkOut: optionalString(10),
  remarks: optionalString(300),
});
