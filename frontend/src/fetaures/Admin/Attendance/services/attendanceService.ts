import apiClient, { getList, toQueryParams, unwrap } from '../../../../services/api/apiClient';
import type { AttendanceRecord, AttendanceStatus, AttendanceSummary, PaginatedResult } from '../../../../types';

export interface AttendanceRecordInput {
  member: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
}

export interface BulkAttendanceInput {
  event: string;
  date: string;
  records: AttendanceRecordInput[];
}

export const fetchAttendance = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<AttendanceRecord>> =>
  getList<AttendanceRecord>('/attendance', params);

export const fetchAttendanceById = async (id: string): Promise<AttendanceRecord> =>
  unwrap(await apiClient.get<{ data: AttendanceRecord }>(`/attendance/${id}`));

export const markIndividualAttendance = async (payload: {
  member: string;
  event: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  remarks?: string;
}): Promise<AttendanceRecord> =>
  unwrap(await apiClient.post<{ data: AttendanceRecord }>('/attendance/mark', payload));

export const markBulkAttendance = async (payload: BulkAttendanceInput): Promise<AttendanceRecord[]> =>
  unwrap(await apiClient.post<{ data: AttendanceRecord[] }>('/attendance/bulk', payload));

export const updateAttendance = async (
  id: string,
  payload: Partial<AttendanceRecord> & { status?: AttendanceStatus; date?: string },
): Promise<AttendanceRecord> =>
  unwrap(await apiClient.patch<{ data: AttendanceRecord }>(`/attendance/${id}`, payload));

export const deleteAttendance = async (id: string): Promise<void> => {
  await apiClient.delete(`/attendance/${id}`);
};

export const fetchAttendanceSummary = async (
  params?: Record<string, unknown>,
): Promise<AttendanceSummary> =>
  unwrap(await apiClient.get<{ data: AttendanceSummary }>('/attendance/summary', {
    params: toQueryParams(params),
  }));

/** Members eligible to be marked for a given event (scoped roster). */
export const fetchEventRoster = async (
  eventId: string,
  params?: Record<string, unknown>,
): Promise<PaginatedResult<unknown>> =>
  apiClient.get(`/attendance/events/${eventId}/roster`, { params: toQueryParams(params) });

export const fetchMyAttendance = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<AttendanceRecord>> =>
  getList<AttendanceRecord>('/attendance/mine', params);

export const fetchMyAttendanceSummary = async (): Promise<AttendanceSummary> =>
  unwrap(await apiClient.get<{ data: AttendanceSummary }>('/attendance/mine/summary'));
