import apiClient, { getList, unwrap } from '../../../../services/api/apiClient';
import type {
  CreatedAccountResult,
  PaginatedResult,
  PermissionCatalogEntry,
  RoleRecord,
  RoleName,
  UserAccount,
} from '../../../../types';

export interface CreateAdministratorInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  role: RoleName;
  password?: string;
  district?: string;
  unit?: string;
  community?: string;
  committee?: string;
  note?: string;
}

export const fetchAdministrators = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<UserAccount>> =>
  getList<UserAccount>('/administrators', params);

export const fetchAdministratorById = async (id: string): Promise<UserAccount> =>
  unwrap(await apiClient.get<{ data: UserAccount }>(`/administrators/${id}`));

/** Only an authorised administrator (normally the Super Admin) may create these. */
export const createAdministrator = async (
  payload: CreateAdministratorInput,
): Promise<CreatedAccountResult> =>
  unwrap(await apiClient.post<{ data: CreatedAccountResult }>('/administrators', payload));

export const updateAdministrator = async (
  id: string,
  payload: Partial<CreateAdministratorInput>,
): Promise<UserAccount> =>
  unwrap(await apiClient.patch<{ data: UserAccount }>(`/administrators/${id}`, payload));

export const setAdministratorStatus = async (id: string, status: string): Promise<unknown> =>
  unwrap(await apiClient.patch<{ data: unknown }>(`/administrators/${id}/status`, { status }));

export const resetAdministratorPassword = async (id: string): Promise<{ temporaryPassword: string }> =>
  unwrap(
    await apiClient.post<{ data: { temporaryPassword: string } }>(`/administrators/${id}/reset-password`),
  );

/* ------------------------- Roles & permissions ------------------------ */

export const fetchRoles = async (params?: Record<string, unknown>): Promise<PaginatedResult<RoleRecord>> =>
  getList<RoleRecord>('/roles', params);

export const fetchRoleById = async (id: string): Promise<RoleRecord> =>
  unwrap(await apiClient.get<{ data: RoleRecord }>(`/roles/${id}`));

export const fetchPermissionCatalog = async (): Promise<PermissionCatalogEntry[]> => {
  const response = await apiClient.get<{
    data: { total: number; modules: Array<{ module: string; permissions: PermissionCatalogEntry[] }> };
  }>('/permissions/grouped');
  return response.data.data.modules.flatMap((group) => group.permissions);
};

export const updateRolePermissions = async (id: string, permissions: string[]): Promise<RoleRecord> =>
  unwrap(
    await apiClient.patch<{ data: RoleRecord }>(`/administrators/roles/${id}/permissions`, { permissions }),
  );
