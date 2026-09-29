import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import type { PaginationMeta } from '../../types';

/* Compact, information-dense table: `py-2` rows, horizontal scroll on mobile. */

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Hidden on small screens unless marked as a priority column. */
  priority?: boolean;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render: (row: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  empty?: ReactNode;
  sort?: string;
  order?: 'asc' | 'desc';
  onSort?: (column: Column<T>) => void;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onToggleRow?: (id: string) => void;
  onToggleAll?: (checked: boolean) => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  empty,
  sort,
  order = 'desc',
  onSort,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onToggleRow,
  onToggleAll,
}: DataTableProps<T>) {
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white shadow-sm">
      <table className="app-table">
        <thead>
          <tr>
            {selectable && (
              <th scope="col" className="w-9">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 cursor-pointer rounded border-line accent-primary"
                  checked={allSelected}
                  onChange={(event) => onToggleAll?.(event.target.checked)}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column) => {
              const isSorted = sort === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={column.priority === false ? 'hidden md:table-cell' : ''}
                  aria-sort={isSorted ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column)}
                      className="inline-flex items-center gap-1 hover:text-slate-700"
                    >
                      {column.header}
                      {isSorted ? (
                        order === 'asc' ? (
                          <ChevronUp className="h-3 w-3" aria-hidden />
                        ) : (
                          <ChevronDown className="h-3 w-3" aria-hidden />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-40" aria-hidden />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`}>
                {selectable && (
                  <td>
                    <div className="h-3.5 w-3.5 animate-pulse rounded bg-slate-200" />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className={column.priority === false ? 'hidden md:table-cell' : ''}>
                    <div className="h-3.5 w-full max-w-28 animate-pulse rounded bg-slate-200" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="p-0">
                {empty ?? <div className="p-6 text-center text-sm text-muted">No records found</div>}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = rowKey(row);
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                >
                  {selectable && (
                    <td onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 cursor-pointer rounded border-line accent-primary"
                        checked={selectedIds.includes(id)}
                        onChange={() => onToggleRow?.(id)}
                        aria-label="Select row"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`${column.priority === false ? 'hidden md:table-cell' : ''} ${
                        column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                      }`}
                    >
                      {column.render(row, 0)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface PaginationProps {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  itemLabel?: string;
}

export function Pagination({ meta, onPageChange, onLimitChange, itemLabel = 'records' }: PaginationProps) {
  if (!meta || meta.total === 0) return null;
  const { page, limit, total, totalPages } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-muted">
        Showing <span className="font-medium text-slate-700">{from}</span>-
        <span className="font-medium text-slate-700">{to}</span> of{' '}
        <span className="font-medium text-slate-700">{total}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        {onLimitChange && (
          <select
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="h-8 cursor-pointer rounded-lg border border-line bg-white px-2 text-xs text-slate-700"
            aria-label="Rows per page"
          >
            {[10, 20, 50, 100].map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasPrevPage}
            onClick={() => onPageChange(page - 1)}
            leftIcon={<ChevronLeft className="h-3.5 w-3.5" aria-hidden />}
          >
            Prev
          </Button>
          <span className="px-2 text-xs text-muted">
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasNextPage}
            onClick={() => onPageChange(page + 1)}
            rightIcon={<ChevronRight className="h-3.5 w-3.5" aria-hidden />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

