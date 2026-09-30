import apiClient, { unwrap } from '../../../../../services/api/apiClient';
import type { AdminProfile } from '../types/profileTypes';

export const fetchMyAdminProfile = async (): Promise<AdminProfile> =>
  unwrap(await apiClient.get<{ data: AdminProfile }>('/administrators/me'));

export const updateMyAdminProfile = async (
  payload: Partial<AdminProfile>,
): Promise<AdminProfile> =>
  unwrap(await apiClient.patch<{ data: AdminProfile }>('/administrators/me', payload));