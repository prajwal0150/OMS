import { Search, X } from 'lucide-react';

export interface MemberToolbarProps {
  title: string;
  description?: string;
  search: string;
  onSearchChange: (value: string) => void;
  actions?: React.ReactNode;
}

/** Compact page header + debounced search shared by the member portal pages. */
export function MemberToolbar({
  title,
  description,
  search,
  onSearchChange,
  actions,
}: MemberToolbarProps) {
  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-secondary">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {actions}
      </div>

      <div className="relative mt-2 max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search..."
          aria-label={title}
          className="h-9 w-full rounded-lg border border-line bg-white pr-8 pl-8 text-sm shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}

export default MemberToolbar;
