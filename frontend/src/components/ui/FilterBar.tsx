import { useEffect, useState, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from './Button';
import { Select } from './Input';

export interface FilterField {
  name: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  /** `ResourceListPage` supplies this, so list pages only declare the options. */
  onChange?: (value: string) => void;
  className?: string;
}

/**
 * Search + filter row used by every admin list screen. The search input is
 * debounced so typing does not flood the API.
 */
export interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  fields?: FilterField[];
  onReset?: () => void;
  actions?: ReactNode;
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  fields = [],
  onReset,
  actions,
}: FilterBarProps) {
  const [term, setTerm] = useState(search);

  useEffect(() => setTerm(search), [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (term !== search) onSearchChange(term);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [term, search, onSearchChange]);

  const hasFilters = Boolean(search) || fields.some((field) => field.value);

  return (
    <div className="mb-3 flex flex-wrap items-end gap-2">
      <div className="relative min-w-48 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-9 w-full rounded-lg border border-line bg-white pr-8 pl-8 text-sm shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
        {term && (
          <button
            type="button"
            onClick={() => setTerm('')}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      {fields.map((field) => (
        <Select
          key={field.name}
          value={field.value}
          onChange={(event) => field.onChange?.(event.target.value)}
          options={field.options}
          placeholder={field.label}
          aria-label={field.label}
          className={field.className ?? 'min-w-36'}
          containerClassName={field.className ? 'min-w-36' : undefined}
        />
      ))}

      {onReset && hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} leftIcon={<X className="h-3.5 w-3.5" />}>
          Reset
        </Button>
      )}

      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}
