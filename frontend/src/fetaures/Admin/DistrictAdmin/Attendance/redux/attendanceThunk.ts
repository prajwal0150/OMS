import { createListSlice } from '../../../../../shared/listSlice';
import { fetchAttendance, fetchAttendanceById as fetchOneById } from '../services/attendanceService';
import type { AttendanceRecord } from '../../../../../types';

/**
 * Attendance list + detail state.
 * The thunks and reducer are generated from the shared list factory so every
 * feature exposes the same request-status contract.
 */
const slice = createListSlice<AttendanceRecord>('districtAdmin.attendance', {
  fetchList: fetchAttendance,
  fetchOne: fetchOneById,
});

export const fetchAttendanceList = slice.fetchList;
export const fetchAttendanceById = slice.fetchOne!;
export const { mutationStarted, mutationSucceeded, mutationFailed, selectedCleared, upserted, removed, reset } = slice.actions;
export default slice.reducer;
