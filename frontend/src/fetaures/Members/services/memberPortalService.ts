import apiClient, { getList, unwrap } from '../../../services/api/apiClient';
import type {
  Announcement,
  AttendanceRecord,
  AttendanceSummary,
  Committee,
  ContentRecord,
  DocumentFile,
  EventRecord,
  Member,
  PaginatedResult,
} from '../../../types';

/**
 * Member portal endpoints. Every call is already scope aware on the server:
 * a member can only ever read their own profile, attendance and committees,
 * plus the content, announcements and documents their visibility allows.
 */

export const fetchMyProfile = async (): Promise<Member> =>
  unwrap(await apiClient.get<{ data: Member }>('/members/me'));

export const updateMyProfile = async (payload: Partial<Member>): Promise<Member> =>
  unwrap(await apiClient.patch<{ data: Member }>('/members/me', payload));

export const fetchMyCommittees = async (): Promise<Committee[]> =>
  unwrap(await apiClient.get<{ data: Committee[] }>('/committees/mine'));

export const fetchMyEvents = (params?: Record<string, unknown>): Promise<PaginatedResult<EventRecord>> =>
  getList<EventRecord>('/events/mine', params);

export const fetchMyAttendance = (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<AttendanceRecord>> =>
  getList<AttendanceRecord>('/attendance/mine', params);

export const fetchMyAttendanceSummary = async (): Promise<AttendanceSummary> =>
  unwrap(await apiClient.get<{ data: AttendanceSummary }>('/attendance/mine/summary'));

export const fetchMyContent = (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<ContentRecord>> => getList<ContentRecord>('/content/mine', params);

export const fetchMyAnnouncements = (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<Announcement>> => getList<Announcement>('/announcements/mine', params);

export const fetchMyDocuments = (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<DocumentFile>> => getList<DocumentFile>('/documents/mine', params);
