import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
  statusTone,
} from '../../../../components';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { useAuthState } from '../../../Auth/hooks/useAuth';
import { humanize, refName, type AuditLogEntry } from '../../../../types';

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'publish', label: 'Publish' },
  { value: 'review', label: 'Review' },
  { value: 'login', label: 'Sign in' },
  { value: 'export', label: 'Export' },
];

/**
 * Immutable audit trail. The backend writes an entry for every mutating
 * request; this screen is read only and cannot alter history.
 */
export function AuditLogsPage() {
  const { can } = useAuthState();
  const { items, pagination, loading, error, setPage, search, setSearch, refresh, setFilter } =
    useAuditLogs();
  const [action, setAction] = useState('');

  useEffect(() => {
    setFilter('action', action);
  }, [action, setFilter]);

  if (!can('audit.view')) {
    return <ErrorState message="You do not have permission to view the audit trail." />;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-secondary">Audit log</h1>
          <p className="mt-0.5 text-sm text-muted">
            Every create, update, delete, publish and sign in recorded in your scope.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={refresh} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
          Refresh
        </Button>
      </div>

      <Card padding="sm" className="mb-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="mb-1 block text-xs font-medium text-muted">Search</label>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Actor, entity, IP address..."
              className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-sm shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
          <div className="w-44">
            <label className="mb-1 block text-xs font-medium text-muted">Action</label>
            <select
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="h-9 w-full rounded-lg border border-line bg-white px-2 text-sm shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              {ACTION_OPTIONS.map((option) => (
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
          <EmptyState title="No audit entries" description="Activity will appear here as it happens." />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-white shadow-sm">
          <table className="app-table">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Actor</th>
                <th scope="col">Action</th>
                <th scope="col">Entity</th>
                <th scope="col" className="hidden lg:table-cell">
                  Changes
                </th>
                <th scope="col" className="hidden xl:table-cell">
                  IP
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((log: AuditLogEntry) => (
                <tr key={log._id}>
                  <td className="whitespace-nowrap text-xs text-slate-600">
                    {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td>
                    <p className="text-sm text-slate-800">{log.userLabel ?? refName(log.user) ?? 'System'}</p>
                    {log.userRole && <p className="text-xs text-muted">{humanize(log.userRole)}</p>}
                  </td>
                  <td>
                    <Badge tone={statusTone(log.action)}>{humanize(log.action)}</Badge>
                  </td>
                  <td className="text-xs text-slate-600">
                    <p className="font-medium text-slate-700">{humanize(log.entity)}</p>
                    {log.entityId && <p className="font-mono text-[11px] text-muted">{log.entityId}</p>}
                  </td>
                  <td className="hidden max-w-72 lg:table-cell">
                    <details>
                      <summary className="cursor-pointer text-xs text-primary">View entry</summary>
                      <pre className="mt-1 max-h-40 overflow-auto rounded bg-slate-50 p-1.5 font-mono text-[11px] whitespace-pre-wrap text-slate-700">
                        {JSON.stringify(log, null, 2)}
                      </pre>
                    </details>
                  </td>
                  <td className="hidden font-mono text-[11px] text-muted xl:table-cell">{log.ipAddress ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination meta={pagination ?? undefined} onPageChange={setPage} itemLabel="entries" />
    </div>
  );
}

export default AuditLogsPage;
