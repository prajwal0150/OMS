import apiClient, { getList, normalizeApiError, unwrap } from '../../../services/api/apiClient';
import type { ApiResponse, AuthUser, PaginatedResult, Session } from '../../../types';

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export const login = async (input: LoginInput): Promise<Session> =>
  unwrap(await apiClient.post<{ data: Session }>('/auth/login', input));

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

export const fetchCurrentUser = async (): Promise<AuthUser> =>
  unwrap(await apiClient.get<{ data: AuthUser }>('/auth/me'));

/**
 * Always resolves: the backend deliberately does not reveal whether an address
 * exists. The reset token is only returned in non-production environments.
 */
export const requestPasswordReset = async (input: ForgotPasswordInput): Promise<{ token?: string }> => {
  const response = await apiClient.post<ApiResponse<{ token?: string }>>(
    '/auth/forgot-password',
    input,
  );
  return response.data.data ?? {};
};

export const resetPassword = async (input: ResetPasswordInput): Promise<void> => {
  await apiClient.post('/auth/reset-password', input);
};

export const changePassword = async (input: ChangePasswordInput): Promise<void> => {
  await apiClient.post('/auth/change-password', input);
};

export const fetchMembers = async (params?: Record<string, unknown>): Promise<PaginatedResult<never>> =>
  getList<never>('/members', params);

export { normalizeApiError };
