import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Inbox, Mail, MailOpen, Reply, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Modal,
  Pagination,
  Skeleton,
  Textarea,
  statusTone,
} from '../../../../components';
import {
  fetchContactMessages,
  updateContactMessage,
} from '../services/contactMessageService';
import { normalizeApiError } from '../../../../services/api/apiClient';
import { humanize, type ContactMessage, type PaginationMeta } from '../../../../types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'READ', label: 'Read' },
  { value: 'REPLIED', label: 'Replied' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'SPAM', label: 'Spam' },
];

/** Inbox for messages submitted through the public contact page. */
export function ContactMessagesPage() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('NEW');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<ContactMessage | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchContactMessages({
        page,
        limit: 15,
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
      });
      setItems(result.items);
      setPagination(result.meta?.pagination);
    } catch (caught) {
      setError(normalizeApiError(caught).message);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const open = (message: ContactMessage) => {
    setActive(message);
    setNote(message.replyNote ?? '');
    // Opening a new message marks it read, which clears its notification badge.
    if (message.status === 'NEW') {
      void updateContactMessage(message._id, { status: 'READ' })
        .then(() => load())
        .catch(() => undefined);
    }
  };

  const setStatusFor = async (message: ContactMessage, next: string) => {
    try {
      await updateContactMessage(message._id, { status: next });
      toast.success(`Marked as ${humanize(next).toLowerCase()}`);
      setActive(null);
      void load();
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    }
  };

  const saveReplyNote = async () => {
    if (!active) return;
    setSaving(true);
    try {
      await updateContactMessage(active._id, { status: 'REPLIED', replyNote: note });
      toast.success('Reply recorded');
      setActive(null);
      void load();
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-3">
        <h1 className="text-xl font-semibold text-secondary">Contact messages</h1>
        <p className="mt-0.5 text-sm text-muted">
          Enquiries submitted through the public contact page.
        </p>
      </div>

      <Card padding="sm" className="mb-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="mb-1 block text-xs font-medium text-muted">Search</label>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Name, email or subject..."
              className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-sm shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
          <div className="w-44">
            <label className="mb-1 block text-xs font-medium text-muted">Status</label>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg border border-line bg-white px-2 text-sm shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : loading ? (
        <Card>
          <Skeleton className="h-40 w-full" />
        </Card>
      ) : items.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="No messages"
            description="Enquiries from the public contact page will appear here."
            icon={<Inbox className="h-5 w-5" />}
          />
        </Card>
      ) : (
        <Card padding="none">
          <ul className="divide-y divide-line">
            {items.map((message) => (
              <li key={message._id}>
                <button
                  type="button"
                  onClick={() => open(message)}
                  className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      message.status === 'NEW'
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {message.status === 'NEW' ? (
                      <Mail className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <MailOpen className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{message.name}</p>
                      <span className="text-xs text-muted">{message.email}</span>
                      <Badge tone={statusTone(message.status)} dot>
                        {humanize(message.status)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-700">{message.subject}</p>
                    <p className="line-clamp-1 text-xs text-muted">{message.message}</p>
                  </div>
                  <span className="hidden shrink-0 text-xs text-muted sm:block">
                    {message.createdAt ? format(new Date(message.createdAt), 'MMM d, yyyy') : '--'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Pagination meta={pagination} onPageChange={setPage} itemLabel="messages" />

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active?.subject ?? 'Message'}
        description={active ? `${active.name} - ${active.email}` : undefined}
        size="lg"
        footer={
          <>
            {active && active.status !== 'SPAM' && active.status !== 'ARCHIVED' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-danger"
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => void setStatusFor(active, 'SPAM')}
              >
                Mark as spam
              </Button>
            )}
            {active && active.status !== 'ARCHIVED' && (
              <Button size="sm" variant="outline" onClick={() => void setStatusFor(active, 'ARCHIVED')}>
                Archive
              </Button>
            )}
            <Button
              size="sm"
              leftIcon={<Reply className="h-3.5 w-3.5" />}
              loading={saving}
              onClick={() => void saveReplyNote()}
            >
              Record reply
            </Button>
          </>
        }
      >
        {active && (
          <div className="space-y-3">
            <div className="rounded-lg border border-line bg-slate-50 p-3">
              <p className="text-sm whitespace-pre-line text-slate-800">{active.message}</p>
            </div>

            <dl className="grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-muted">Received</dt>
                <dd className="text-slate-700">{active.createdAt
                      ? format(new Date(active.createdAt), 'MMM d, yyyy HH:mm')
                      : '--'}</dd>
              </div>
              {active.phone && (
                <div>
                  <dt className="text-muted">Phone</dt>
                  <dd className="text-slate-700">{active.phone}</dd>
                </div>
              )}
              {active.ipAddress && (
                <div>
                  <dt className="text-muted">IP address</dt>
                  <dd className="font-mono text-slate-700">{active.ipAddress}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted">Status</dt>
                <dd>
                  <Badge tone={statusTone(active.status)} dot>
                    {humanize(active.status)}
                  </Badge>
                </dd>
              </div>
            </dl>

            <Textarea
              label="Reply note"
              rows={4}
              hint="Recorded for the audit trail. Send the reply from your own email client."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />

            <p className="flex items-center gap-1.5 text-xs text-muted">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Recording a reply marks this message as replied.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ContactMessagesPage;
