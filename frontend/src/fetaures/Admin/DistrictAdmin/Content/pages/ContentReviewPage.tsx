import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Eye, FileText } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
  statusTone,
} from '../../../../../components';
import { useContent } from '../hooks/useContent';
import { humanize, refName } from '../../../../../types';

const STATUS_OPTIONS = [
  { value: 'PENDING_REVIEW', label: 'Pending review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

/**
 * Content library. Posts go live straight from the feed composer, so this
 * screen is a status-filtered browser of everything published, drafted or
 * filed away - with a preview link for reading the full post.
 */
export function ContentReviewPage() {
  const { items, pagination, loading, error, setPage, search, setSearch, refresh, setFilter } =
    useContent();
  const [status, setStatus] = useState('PUBLISHED');

  useEffect(() => {
    setFilter('status', status);
  }, [status, setFilter]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-secondary">Content</h1>
          <p className="mt-0.5 text-sm text-muted">
            Browse every post by status - published posts appear on the site according to their
            audience.
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
            title="No posts with this status"
            description="Posts appear here based on the status filter you choose above."
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination meta={pagination ?? undefined} onPageChange={setPage} itemLabel="items" />

    </div>
  );
}

export default ContentReviewPage;
