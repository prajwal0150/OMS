import apiClient, { getList } from '../../../services/api/apiClient';
import type { NotificationItem, PaginatedResult } from '../../../types';

export const fetchNotifications = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<NotificationItem>> =>
  getList<NotificationItem>('/notifications', params);

export const fetchUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get<{ data: { unread: number } }>('/notifications/unread-count');
  return response.data.data.unread;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await apiClient.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<number> => {
  const response = await apiClient.patch<{ data: { updated: number } }>('/notifications/read-all');
  return response.data.data.updated;
};

export const deleteNotification = async (id: string): Promise<void> => {
  await apiClient.delete(`/notifications/${id}`);
};
