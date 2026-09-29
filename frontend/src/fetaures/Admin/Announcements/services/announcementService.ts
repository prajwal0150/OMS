import apiClient, { getList, unwrap } from '../../../../services/api/apiClient';
import type { Announcement, PaginatedResult } from '../../../../types';

export const fetchAnnouncements = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<Announcement>> =>
  getList<Announcement>('/announcements', params);

export const fetchPublicAnnouncements = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<Announcement>> =>
  getList<Announcement>('/announcements/public', params);

export const fetchPublicAnnouncement = async (id: string): Promise<Announcement> =>
  unwrap(await apiClient.get<{ data: Announcement }>(`/announcements/public/${id}`));

export const fetchAnnouncementsForMember = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<Announcement>> =>
  getList<Announcement>('/announcements/mine', params);

export const fetchAnnouncementById = async (id: string): Promise<Announcement> =>
  unwrap(await apiClient.get<{ data: Announcement }>(`/announcements/${id}`));

export const createAnnouncement = async (payload: Partial<Announcement>): Promise<Announcement> =>
  unwrap(await apiClient.post<{ data: Announcement }>('/announcements', payload));

export const updateAnnouncement = async (id: string, payload: Partial<Announcement>): Promise<Announcement> =>
  unwrap(await apiClient.patch<{ data: Announcement }>(`/announcements/${id}`, payload));

export const deleteAnnouncement = async (id: string): Promise<void> => {
  await apiClient.delete(`/announcements/${id}`);
};

export const fetchAnnouncementTrend = async (months = 12): Promise<Array<{ month: string; count: number }>> =>
  unwrap(
    await apiClient.get<{ data: Array<{ month: string; count: number }> }>('/announcements/monthly', {
      params: { months },
    }),
  );
