import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/** Reference instant for notifications that have no timestamp yet. */
const NOW = Date.now();
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
} from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  loadNotifications,
  markAllRead,
  markRead,
  removeNotification,
} from '../redux/notificationThunk';
import {
  selectNotifications,
  selectNotificationsError,
  selectNotificationsLoading,
  selectNotificationsPagination,
  selectUnreadCount,
} from '../redux/notificationSelector';
import { humanize } from '../../../types';

/** Shared notifications screen used by both the admin and the member portal. */
export function NotificationsPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectNotifications);
  const pagination = useAppSelector(selectNotificationsPagination);
  const loading = useAppSelector(selectNotificationsLoading);
  const error = useAppSelector(selectNotificationsError);
  const unread = useAppSelector(selectUnreadCount);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    void dispatch(loadNotifications({ page, limit: 15 }));
  }, [dispatch, page]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-secondary">Notifications</h1>
          <p className="mt-0.5 text-sm text-muted">
            {unread > 0 ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'You are all caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void dispatch(markAllRead())}
            disabled={unread === 0}
            leftIcon={<CheckCheck className="h-3.5 w-3.5" />}
          >
            Mark all read
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void dispatch(loadNotifications({ page: 1, limit: 15 }))}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorState
          message={error}
          onRetry={() => void dispatch(loadNotifications({ page, limit: 15 }))}
        />
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="No notifications"
            description="Announcements, events and content updates will appear here."
            icon={<Bell className="h-5 w-5" />}
          />
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((notification) => (
            <li key={notification._id}>
              <Card
                className={`flex items-start gap-3 ${notification.isRead ? '' : 'border-primary/30 bg-primary-soft/30'}`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    notification.isRead ? 'bg-slate-100 text-slate-400' : 'bg-primary text-white'
                  }`}
                >
                  <Bell className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">{notification.title}</p>
                    <Badge tone="neutral">{humanize(notification.type)}</Badge>
                    {!notification.isRead && <Badge tone="primary">New</Badge>}
                  </div>
                  {notification.message && (
                    <p className="mt-0.5 text-xs text-slate-600">{notification.message}</p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {formatDistanceToNow(new Date(notification.createdAt ?? NOW), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {notification.link && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void dispatch(markRead(notification._id));
                        navigate(notification.link as string);
                      }}
                    >
                      Open
                    </Button>
                  )}
                  {!notification.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void dispatch(markRead(notification._id))}
                    >
                      Mark read
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete notification"
                    onClick={() => void dispatch(removeNotification(notification._id))}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        meta={pagination ?? undefined}
        onPageChange={setPage}
        itemLabel="notifications"
      />
    </div>
  );
}

export default NotificationsPage;
