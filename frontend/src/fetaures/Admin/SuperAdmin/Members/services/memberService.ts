import apiClient, { getList, toQueryParams, unwrap } from '../../../../../services/api/apiClient';
import type {
  CreatedAccountResult,
  Member,
  MemberStatusSummary,
  PaginatedResult,
  Breakdown,
  UserAccount,
} from '../../../../../types';

export interface MemberBreakdowns {
  byUnit: Breakdown[];
  byCommunity: Breakdown[];
  byGender: Breakdown[];
  byMembershipType: Breakdown[];
}

export const fetchMembers = async (params?: Record<string, unknown>): Promise<PaginatedResult<Member>> =>
  getList<Member>('/members', params);

export const fetchMemberById = async (id: string): Promise<Member> =>
  unwrap(await apiClient.get<{ data: Member }>(`/members/${id}`));

export const createMember = async (payload: Partial<Member>): Promise<Member> =>
  unwrap(await apiClient.post<{ data: Member }>('/members', payload));

export const updateMember = async (id: string, payload: Partial<Member>): Promise<Member> =>
  unwrap(await apiClient.patch<{ data: Member }>(`/members/${id}`, payload));

export const deleteMember = async (id: string): Promise<void> => {
  await apiClient.delete(`/members/${id}`);
};

export const fetchMemberSummary = async (
  params?: Record<string, unknown>,
): Promise<MemberStatusSummary> =>
  unwrap(await apiClient.get<{ data: MemberStatusSummary }>('/members/summary', {
    params: toQueryParams(params),
  }));

export const fetchMemberBreakdowns = async (
  params?: Record<string, unknown>,
): Promise<MemberBreakdowns> =>
  unwrap(await apiClient.get<{ data: MemberBreakdowns }>('/members/breakdowns', {
    params: toQueryParams(params),
  }));

/* --------------------------- Member accounts -------------------------- */

export interface CreateMemberAccountInput {
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
}

export const createMemberAccount = async (
  memberId: string,
  payload: CreateMemberAccountInput,
): Promise<CreatedAccountResult> =>
  unwrap(
    await apiClient.post<{ data: CreatedAccountResult }>(`/members/${memberId}/account`, payload),
  );

export const fetchMemberAccount = async (memberId: string): Promise<UserAccount | null> =>
  unwrap(await apiClient.get<{ data: UserAccount | null }>(`/members/${memberId}/account`));

export const fetchMemberAccounts = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<UserAccount>> =>
  getList<UserAccount>('/members/accounts', params);

export const setMemberAccountStatus = async (
  accountId: string,
  status: string,
): Promise<unknown> =>
  unwrap(await apiClient.patch<{ data: unknown }>(`/members/accounts/${accountId}/status`, { status }));

export const resetMemberAccountPassword = async (accountId: string): Promise<{ temporaryPassword: string }> =>
  unwrap(
    await apiClient.post<{ data: { temporaryPassword: string } }>(
      `/members/accounts/${accountId}/reset-password`,
    ),
  );

/* --------------------- Registration approvals ------------------------ */

/** Members whose unit level registration still awaits district approval. */
export const fetchRegistrationRequests = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<Member>> => getList<Member>('/members/requests', params);

export const approveMemberRegistration = async (
  memberId: string,
  note?: string,
): Promise<Member> =>
  unwrap(await apiClient.post<{ data: Member }>(`/members/${memberId}/approve`, { note }));

export const rejectMemberRegistration = async (
  memberId: string,
  reason: string,
): Promise<Member> =>
  unwrap(await apiClient.post<{ data: Member }>(`/members/${memberId}/reject`, { reason }));

/* ---------------------------- Member portal --------------------------- */

export const fetchOwnProfile = async (): Promise<Member> =>
  unwrap(await apiClient.get<{ data: Member }>('/members/me'));

export const updateOwnProfile = async (payload: Partial<Member>): Promise<Member> =>
  unwrap(await apiClient.patch<{ data: Member }>('/members/me', payload));
