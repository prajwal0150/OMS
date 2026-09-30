import apiClient, { getList, unwrap } from '../../../../../services/api/apiClient';
import type {
  Committee,
  Community,
  District,
  OptionItem,
  Organization,
  PaginatedResult,
  Unit,
} from '../../../../../types';

/* ---------------------------- Organization ---------------------------- */

export const fetchOrganization = async (): Promise<Organization> =>
  unwrap(await apiClient.get<{ data: Organization }>('/organization'));

export const fetchPublicOrganization = async (): Promise<Organization> =>
  unwrap(await apiClient.get<{ data: Organization }>('/organization/public'));

export const updateOrganization = async (payload: Partial<Organization>): Promise<Organization> =>
  unwrap(await apiClient.patch<{ data: Organization }>('/organization', payload));

export const uploadOrganizationLogo = async (file: File): Promise<{ logo: string }> => {
  const form = new FormData();
  form.append('logo', file);
  const response = await apiClient.post<{ data: { logo: string } }>('/organization/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

/* ----------------------------- Districts ------------------------------ */

export const fetchDistricts = async (params?: Record<string, unknown>): Promise<PaginatedResult<District>> =>
  getList<District>('/districts', params);

export const fetchPublicDistrict = async (): Promise<District> =>
  unwrap(await apiClient.get<{ data: District }>('/districts/public'));

export const fetchDistrictById = async (id: string): Promise<District> =>
  unwrap(await apiClient.get<{ data: District }>(`/districts/${id}`));

export const createDistrict = async (payload: Partial<District>): Promise<District> =>
  unwrap(await apiClient.post<{ data: District }>('/districts', payload));

export const updateDistrict = async (id: string, payload: Partial<District>): Promise<District> =>
  unwrap(await apiClient.patch<{ data: District }>(`/districts/${id}`, payload));

/* -------------------------------- Units ------------------------------- */

export const fetchUnits = async (params?: Record<string, unknown>): Promise<PaginatedResult<Unit>> =>
  getList<Unit>('/units', params);

export const fetchPublicUnits = async (params?: Record<string, unknown>): Promise<PaginatedResult<Unit>> =>
  getList<Unit>('/units/public', params);

export const fetchUnitById = async (id: string): Promise<Unit> =>
  unwrap(await apiClient.get<{ data: Unit }>(`/units/${id}`));

export const createUnit = async (payload: Partial<Unit>): Promise<Unit> =>
  unwrap(await apiClient.post<{ data: Unit }>('/units', payload));

export const updateUnit = async (id: string, payload: Partial<Unit>): Promise<Unit> =>
  unwrap(await apiClient.patch<{ data: Unit }>(`/units/${id}`, payload));

export const deleteUnit = async (id: string): Promise<void> => {
  await apiClient.delete(`/units/${id}`);
};

/** Scoped option list used by pickers and filters. */
export const fetchUnitOptions = async (): Promise<OptionItem[]> =>
  unwrap(await apiClient.get<{ data: OptionItem[] }>('/units/options'));

/* ----------------------------- Communities ---------------------------- */

export const fetchCommunities = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<Community>> =>
  getList<Community>('/communities', params);

export const fetchPublicCommunities = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<Community>> =>
  getList<Community>('/communities/public', params);

export const fetchCommunityById = async (id: string): Promise<Community> =>
  unwrap(await apiClient.get<{ data: Community }>(`/communities/${id}`));

export const createCommunity = async (payload: Partial<Community>): Promise<Community> =>
  unwrap(await apiClient.post<{ data: Community }>('/communities', payload));

export const updateCommunity = async (id: string, payload: Partial<Community>): Promise<Community> =>
  unwrap(await apiClient.patch<{ data: Community }>(`/communities/${id}`, payload));

export const deleteCommunity = async (id: string): Promise<void> => {
  await apiClient.delete(`/communities/${id}`);
};

export const fetchCommunityOptions = async (): Promise<OptionItem[]> =>
  unwrap(await apiClient.get<{ data: OptionItem[] }>('/communities/options'));

/* ------------------------------ Committees ---------------------------- */

export const fetchCommitteeOptions = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<Committee>> =>
  getList<Committee>('/committees', { limit: 200, sort: 'name', order: 'asc', ...params });
