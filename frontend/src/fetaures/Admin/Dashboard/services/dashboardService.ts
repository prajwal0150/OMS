import apiClient, { toQueryParams, unwrap } from '../../../../services/api/apiClient';
import type { DashboardData } from '../../../../types';

/** Scope-aware analytics powering every dashboard. Units are never ranked. */
export const fetchDashboard = async (params?: Record<string, unknown>): Promise<DashboardData> =>
  unwrap(
    await apiClient.get<{ data: DashboardData }>('/reports/dashboard', {
      params: toQueryParams(params),
    }),
  );

export const fetchDistrictSummary = async (): Promise<unknown> =>
  unwrap(await apiClient.get<{ data: unknown }>('/reports/summary/district'));

export const fetchUnitBreakdown = async (params?: Record<string, unknown>) =>
  unwrap(
    await apiClient.get<{ data: Array<{ key: string; label: string; count: number }> }>(
      '/reports/summary/units',
      { params: toQueryParams(params) },
    ),
  );

export const fetchCommunityBreakdown = async (params?: Record<string, unknown>) =>
  unwrap(
    await apiClient.get<{ data: Array<{ key: string; label: string; count: number }> }>(
      '/reports/summary/communities',
      { params: toQueryParams(params) },
    ),
  );

export const fetchMembershipTrend = async (months = 12) =>
  unwrap(
    await apiClient.get<{ data: Array<{ month: string; count: number }> }>('/reports/trend/membership', {
      params: { months },
    }),
  );
