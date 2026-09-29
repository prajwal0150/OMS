import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../store/store';

const selectState = (state: RootState) => state.notifications;

export const selectNotifications = createSelector([selectState], (s) => s.items);
export const selectNotificationsPagination = createSelector([selectState], (s) => s.pagination);
export const selectUnreadCount = createSelector([selectState], (s) => s.unread);
export const selectNotificationsLoading = createSelector([selectState], (s) => s.status === 'loading');
export const selectNotificationsError = createSelector([selectState], (s) => s.error);
export const selectUnreadNotifications = createSelector(
  [selectNotifications],
  (items) => items.filter((item) => !item.isRead),
);
