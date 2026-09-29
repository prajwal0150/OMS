import { useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import {
  Button,
  Card,
  DataTable,
  ErrorState,
  FilterBar,
  PageHeader,
  Pagination,
  type Column,
  type FilterField,
} from './ui';
import { useListQuery, type UseListQueryOptions } from '../shared/useListQuery';
import type { PaginationMeta } from '../types';

export interface ResourceListPageProps<T> {
  title: string;
  description?: string;
  breadcrumb?: Array<{ label: string }>;
  /** The feature's list thunk. */
  fetchList: (arg: Record<string, unknown>) => unknown;
  items: T[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  columns: Column<T>[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  filters?: FilterField[];
  defaultSort?: string;
  defaultOrder?: 'asc' | 'desc';
  defaultFilters?: Record<string, string>;
  listOptions?: UseListQueryOptions;
  /** Primary action, e.g. "Add Member". */
  primaryAction?: { label: string; onClick: () => void; hidden?: boolean };
  secondaryActions?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  itemLabel?: string;
  toolbarExtra?: ReactNode;
  /** Rendered instead of the table (e.g. a card grid for media). */
  renderGrid?: (rows: T[]) => ReactNode;
}

/**
 * Shared list screen: search, filters, sorting, pagination, empty/error/loading
 * states and a primary action. Every admin list page composes this so the UI
 * stays identical across modules.
 */
export function ResourceListPage<T>({
  title,
  description,
  breadcrumb,
  fetchList,
  items,
  pagination,
  loading,
  error,
  columns,
  rowKey,
  searchPlaceholder,
  filters = [],
  defaultSort = 'createdAt',
  defaultOrder = 'desc',
  defaultFilters,
  listOptions,
  primaryAction,
  secondaryActions,
  emptyTitle,
  emptyDescription,
  onRowClick,
  itemLabel = 'records',
  toolbarExtra,
  renderGrid,
}: ResourceListPageProps<T>) {
  const query = useListQuery(fetchList, {
    defaultSort,
    defaultOrder,
    defaults: defaultFilters,
    ...listOptions,
  });
  const [key, setKey] = useState(0);

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        breadcrumb={breadcrumb}
        actions={
          <>
            {secondaryActions}
            {primaryAction && !primaryAction.hidden && (
              <Button size="sm" onClick={primaryAction.onClick} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                {primaryAction.label}
              </Button>
            )}
          </>
        }
      />

      <FilterBar
        search={query.search}
        onSearchChange={query.setSearch}
        searchPlaceholder={searchPlaceholder ?? `Search ${title.toLowerCase()}⬦`}
        fields={filters.map((filter) => ({ ...filter, onChange: (value) => query.setFilter(filter.name, value) }))}
        onReset={query.reset}
        actions={toolbarExtra}
      />

      {error ? (
        <ErrorState message={error} onRetry={() => { setKey((value) => value + 1); query.refresh(); }} />
      ) : (
        <>
          {renderGrid ? (
            renderGrid(items)
          ) : (
            <DataTable
              key={key}
              columns={columns}
              rows={items}
              rowKey={rowKey}
              loading={loading}
              sort={query.sort}
              order={query.order}
              onSort={(column) => query.setSort(column.key)}
              onRowClick={onRowClick}
              empty={
                <div className="p-8 text-center">
                  <p className="text-sm font-medium text-slate-700">{emptyTitle ?? 'No records found'}</p>
                  {emptyDescription && <p className="mt-1 text-xs text-muted">{emptyDescription}</p>}
                </div>
              }
            />
          )}
          <Pagination
            meta={pagination ?? undefined}
            onPageChange={query.setPage}
            onLimitChange={query.setLimit}
            itemLabel={itemLabel}
          />
        </>
      )}
    </div>
  );
}

/** Small helper so list pages can render an inline detail card. */
export function DetailCard({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-secondary">{title}</h2>
        {actions}
      </div>
      {children}
    </Card>
  );
}

/** Label/value list used across every detail screen. */
export function DescriptionList({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs text-muted">{item.label}</dt>
          <dd className="truncate text-sm text-slate-700">{item.value ?? '-'}</dd>
        </div>
      ))}
    </dl>
  );
}
