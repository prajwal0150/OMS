import apiClient, { getList, unwrap } from '../../../../../services/api/apiClient';
import type { EventRecord, PaginatedResult } from '../../../../../types';

export const fetchEvents = async (params?: Record<string, unknown>): Promise<PaginatedResult<EventRecord>> =>
  getList<EventRecord>('/events', params);

export const fetchPublicEvents = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<EventRecord>> =>
  getList<EventRecord>('/events/public', params);

export const fetchPublicEvent = async (id: string): Promise<EventRecord> =>
  unwrap(await apiClient.get<{ data: EventRecord }>(`/events/public/${id}`));

export const fetchEventById = async (id: string): Promise<EventRecord> =>
  unwrap(await apiClient.get<{ data: EventRecord }>(`/events/${id}`));

export const createEvent = async (payload: Partial<EventRecord>): Promise<EventRecord> =>
  unwrap(await apiClient.post<{ data: EventRecord }>('/events', payload));

export const updateEvent = async (id: string, payload: Partial<EventRecord>): Promise<EventRecord> =>
  unwrap(await apiClient.patch<{ data: EventRecord }>(`/events/${id}`, payload));

export const deleteEvent = async (id: string): Promise<void> => {
  await apiClient.delete(`/events/${id}`);
};

export const fetchUpcomingEvents = async (limit = 6): Promise<EventRecord[]> =>
  unwrap(await apiClient.get<{ data: EventRecord[] }>('/events/upcoming', { params: { limit } }));

export const fetchMyEvents = async (params?: Record<string, unknown>): Promise<PaginatedResult<EventRecord>> =>
  getList<EventRecord>('/events/mine', params);
