import apiClient, { getList, toQueryParams, unwrap } from '../../../../services/api/apiClient';
import type { Committee, CommitteePosition, PaginatedResult } from '../../../../types';

export interface PositionAssignment {
  position: CommitteePosition;
  member?: string;
  remarks?: string;
  assignedDate?: string;
  endDate?: string;
  active?: boolean;
}

export const fetchCommittees = async (
  params?: Record<string, unknown>,
): Promise<PaginatedResult<Committee>> =>
  getList<Committee>('/committees', params);

export const fetchCommitteeById = async (id: string): Promise<Committee> =>
  unwrap(await apiClient.get<{ data: Committee }>(`/committees/${id}`));

export const createCommittee = async (payload: Partial<Committee>): Promise<Committee> =>
  unwrap(await apiClient.post<{ data: Committee }>('/committees', payload));

export const updateCommittee = async (id: string, payload: Partial<Committee>): Promise<Committee> =>
  unwrap(await apiClient.patch<{ data: Committee }>(`/committees/${id}`, payload));

export const deleteCommittee = async (id: string): Promise<void> => {
  await apiClient.delete(`/committees/${id}`);
};

export const fetchMyCommittees = async (): Promise<Committee[]> =>
  unwrap(await apiClient.get<{ data: Committee[] }>('/committees/mine'));

export const fetchCommitteeBreakdown = async (
  params?: Record<string, unknown>,
): Promise<{ level: string; count: number }[]> =>
  unwrap(
    await apiClient.get<{ data: { level: string; count: number }[] }>('/committees/breakdown', {
      params: toQueryParams(params),
    }),
  );

/* ----------------------------- Positions ------------------------------ */

export const assignPosition = async (
  committeeId: string,
  payload: PositionAssignment,
): Promise<Committee> =>
  unwrap(await apiClient.post<{ data: Committee }>(`/committees/${committeeId}/positions`, payload));

export const updatePosition = async (
  committeeId: string,
  positionId: string,
  payload: Partial<PositionAssignment>,
): Promise<Committee> =>
  unwrap(
    await apiClient.patch<{ data: Committee }>(`/committees/${committeeId}/positions/${positionId}`, payload),
  );

export const removePosition = async (committeeId: string, positionId: string): Promise<Committee> =>
  unwrap(await apiClient.delete<{ data: Committee }>(`/committees/${committeeId}/positions/${positionId}`));
