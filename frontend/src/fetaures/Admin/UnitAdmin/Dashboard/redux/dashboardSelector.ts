import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../../store/store';

const selectState = (state: RootState) => state.unitAdmin.dashboard;

export const selectDashboardData = createSelector([selectState], (s) => s.data);
export const selectDashboardLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectDashboardError = createSelector([selectState], (s) => s.error);

/** Derived counts used by the compact stat cards. */
export const selectMemberTotals = createSelector([selectDashboardData], (data) => data?.members ?? null);
export const selectUpcomingEvents = createSelector([selectDashboardData], (data) => data?.upcomingEvents ?? []);
