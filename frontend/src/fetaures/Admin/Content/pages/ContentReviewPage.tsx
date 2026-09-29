import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle2, Eye, FileText, Send, XCircle } from 'lucide-react';
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
import { useContent } from '../hooks/useContent';
import {
  approveContent,
  publishContent,
  rejectContent,
  submitContent,
} from '../services/contentService';
import { normalizeApiError } from '../../../../services/api/apiClient';
import { useAuthState } from '../../../Auth/hooks/useAuth';
import { humanize, refName, type ContentRecord } from '../../../../types';

type Action = 'submit' | 'approve' | 'reject' | 'publish';

const STATUS_OPTIONS = [
  { value: 'PENDING_REVIEW', label: 'Pending review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const ACTION_TITLE: Record<Action, string> = {
  submit: 'Submit for review',
  approve: 'Approve content',
  reject: 'Reject content',
  publish: 'Publish content',
};

/**
 * Publishing queue. Content authored at unit level is submitted here, reviewed
 * by a district administrator, and only then published to the public site.
 * Every transition is enforced again on the backend.
 */
export function ContentReviewPage() {
  const { can } = useAuthState();
  const { items, pagination, loading, error, setPage, search, setSearch, refresh, setFilter } =
    useContent();
  const [status, setStatus] = useState('PENDING_REVIEW');
  const [target, setTarget] = useState<ContentRecord | null>(null);
  const [action, setAction] = useState<Action>('approve');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFilter('status', status);
  }, [status, setFilter]);

  const openAction = (record: ContentRecord, next: Action) => {
    setTarget(record);
    setAction(next);
    setNote('');
  };

  const run = async () => {
    if (!target) return;
    if (action === 'reject' && !note.trim()) {
      toast.error('Give a reason so the author can revise it');
      return;
    }
    setSaving(true);
    try {
      if (action === 'submit') await submitContent(target._id, note || undefined);
      if (action === 'approve') await approveContent(target._id, note || undefined);
      if (action === 'reject') await rejectContent(target._id, note.trim());
      if (action === 'publish') await publishContent(target._id, { notes: note || undefined });
      toast.success(ACTION_TITLE[action].replace(' content', '').replace('Content', 'Content') + ' done');
      setTarget(null);
      refresh();
    } catch (caught) {
      toast.error(normalizeApiError(caught).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-secondary">Content review</h1>
          <p className="mt-0.5 text-sm text-muted">
            Approve or reject content submitted by units before it reaches the public site.
          </p>
        </div>
      </div>

      <Card padding="sm" className="mb-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="mb-1 block text-xs font-medium text-muted">Search</label>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title or summary..."
              className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-sm shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
          <div className="w-48">
            <label className="mb-1 block text-xs font-medium text-muted">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
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
        <ErrorState message={error} onRetry={refresh} />
      ) : loading ? (
        <Card>
          <Skeleton className="h-40 w-full" />
        </Card>
      ) : items.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="Nothing in this queue"
            description="Content appears here as soon as a unit submits it for review."
            icon={<FileText className="h-5 w-5" />}
          />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-white shadow-sm">
          <table className="app-table">
            <thead>
              <tr>
                <th scope="col">Content</th>
                <th scope="col">Type</th>
                <th scope="col" className="hidden lg:table-cell">
                  Scope
                </th>
                <th scope="col" className="hidden xl:table-cell">
                  Author
                </th>
                <th scope="col" className="hidden md:table-cell">
                  Updated
                </th>
                <th scope="col">Status</th>
                <th scope="col" className="text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row._id}>
                  <td className="max-w-80">
                    <div className="flex min-w-0 items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                      <div className="min-w-0">
                        <Link
                          to={`/admin/content/${row._id}/preview`}
                          className="line-clamp-1 font-medium text-slate-800 hover:text-primary"
                        >
                          {row.title}
                        </Link>
                        <p className="line-clamp-1 text-xs text-muted">{row.summary}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge tone="primary">{humanize(row.contentType)}</Badge>
                  </td>
                  <td className="hidden text-xs text-slate-600 lg:table-cell">
                    {[refName(row.unit), refName(row.community)].filter(Boolean).join(' / ') ||
                      'District'}
                  </td>
                  <td className="hidden text-xs text-slate-600 xl:table-cell">
                    {refName(row.author) ?? '--'}
                  </td>
                  <td className="hidden whitespace-nowrap text-xs text-slate-600 md:table-cell">
                    {row.updatedAt || row.createdAt
                      ? format(new Date((row.updatedAt ?? row.createdAt) as string), 'MMM d, yyyy')
                      : '--'}
                  </td>
                  <td>
                    <Badge tone={statusTone(row.status)} dot>
                      {humanize(row.status)}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/content/${row._id}/preview`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Preview"
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                        >
                          Preview
                        </Button>
                      </Link>
                      {(row.status === 'DRAFT' || row.status === 'REJECTED') &&
                        can('content.submit') && (
                          <Button size="sm" variant="ghost" onClick={() => openAction(row, 'submit')}>
                            Submit
                          </Button>
                        )}
                      {row.status === 'PENDING_REVIEW' && can('content.review') && (
                        <>
                          <Button
                            size="sm"
                            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                            onClick={() => openAction(row, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger"
                            leftIcon={<XCircle className="h-3.5 w-3.5" />}
                            onClick={() => openAction(row, 'reject')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {row.status === 'APPROVED' && can('content.publish') && (
                        <Button
                          size="sm"
                          leftIcon={<Send className="h-3.5 w-3.5" />}
                          onClick={() => openAction(row, 'publish')}
                        >
                          Publish
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination meta={pagination ?? undefined} onPageChange={setPage} itemLabel="items" />

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={ACTION_TITLE[action]}
        description={target?.title}
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={action === 'reject' ? 'danger' : 'primary'}
              onClick={() => void run()}
              loading={saving}
            >
              Confirm
            </Button>
          </>
        }
      >
        <Textarea
          label={action === 'reject' ? 'Reason (required)' : 'Note (optional)'}
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          hint={
            action === 'reject'
              ? 'The author sees this message and can revise the content.'
              : undefined
          }
        />
      </Modal>
    </div>
  );
}

export default ContentReviewPage;
