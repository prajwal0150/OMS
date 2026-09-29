import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import apiClient, { normalizeApiError, unwrap } from '../../../../services/api/apiClient';
import type { SearchResult } from '../../../../types';

const EMPTY: SearchResult = { term: '', groups: [], total: 0 };

/**
 * Cross-entity search. The backend applies permission and scope filters, so
 * results can never expose records outside the caller's organizational scope.
 */
export function GlobalSearch() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [result, setResult] = useState<SearchResult>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = term.trim();
    if (query.length < 2) {
      setResult(EMPTY);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    let active = true;
    const timer = window.setTimeout(() => {
      // `/search` returns a grouped SearchResult, not a paginated list.
      apiClient
        .get<{ data: SearchResult }>('/search', { params: { q: query, limit: 5 } })
        .then((response) => {
          if (!active) return;
          setResult(unwrap<SearchResult>(response));
        })
        .catch((error: unknown) => {
          if (!active) return;
          setResult(EMPTY);
          // Surface the reason only in the console; the UI keeps its compact shape.
          console.warn('Search failed:', normalizeApiError(error).message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [term]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (url: string) => {
    setOpen(false);
    setTerm('');
    navigate(url);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        type="search"
        value={term}
        onChange={(event) => {
          setTerm(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search members, units, events..."
        aria-label="Search the platform"
        className="h-8 w-full rounded-lg border border-line bg-slate-50 pr-8 pl-8 text-sm focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:outline-none"
      />
      {loading && (
        <Loader2 className="absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-primary" aria-hidden />
      )}

      {open && term.trim().length >= 2 && (
        <div className="absolute left-0 z-30 mt-1 max-h-96 w-full overflow-y-auto rounded-lg border border-line bg-white p-1 shadow-lg">
          {!loading && result.total === 0 ? (
            <p className="px-3 py-3 text-center text-xs text-muted">No matches for "{term}"</p>
          ) : (
            result.groups.map((group) => (
              <div key={group.entity} className="mb-1 last:mb-0">
                <p className="px-3 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  {group.label}
                </p>
                {group.hits.map((hit) => (
                  <button
                    key={`${hit.entity}-${hit.id}`}
                    type="button"
                    onClick={() => go(hit.url)}
                    className="block w-full rounded-lg px-3 py-1.5 text-left hover:bg-slate-100"
                  >
                    <span className="block truncate text-sm text-slate-700">{hit.title}</span>
                    {hit.subtitle && (
                      <span className="block truncate text-xs text-muted">{hit.subtitle}</span>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
