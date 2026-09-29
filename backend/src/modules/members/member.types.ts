import type { PaginationMeta } from '../../types/api';

export interface MemberListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  unit?: string;
  community?: string;
  gender?: string;
  status?: string;
  membershipType?: string;
  joinedFrom?: string;
  joinedTo?: string;
}

export interface MemberBreakdown {
  key: string;
  label: string;
  count: number;
}

export interface MemberSummary {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  suspended: number;
}

export interface MemberListMeta {
  pagination: PaginationMeta;
}

export interface CreateMemberAccountPayload {
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
}
