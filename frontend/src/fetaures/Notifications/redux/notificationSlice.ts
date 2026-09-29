import slice, {
  loadNotifications,
  loadUnreadCount,
  markAllRead,
  markRead,
  removeNotification,
} from './notificationThunk';

/** Slice entry wired into src/store/store.ts. */
export { loadNotifications, loadUnreadCount, markAllRead, markRead, removeNotification };
export default slice;
