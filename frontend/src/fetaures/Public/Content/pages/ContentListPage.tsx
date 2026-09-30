import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { Badge } from '../../../../components/ui';
import { CONTENT_TYPE, humanize, refName } from '../../../../types';
import {
  PublicFilterSelect,
  PublicPageHeader,
  PublicPagination,
  PublicState,
  PublicToolbar,
} from '../../Layouts/components/publicSections';
import { usePublicList } from '../../hooks/usePublicData';
import { fetchContentPublic } from '../../services/publicService';

const TYPE_OPTIONS = Object.values(CONTENT_TYPE).map((value) => ({
  value,
  label: humanize(value),
}));

export function ContentListPage() {
  // Deep link support: the global header search lands on /content?search=...
  const [params] = useSearchParams();
  const urlSearch = params.get('search') ?? '';

  const list = usePublicList(fetchContentPublic, { limit: 9, search: urlSearch });
  const { setSearch } = list;

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch, setSearch]);


  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PublicPageHeader
        eyebrow="News &amp; stories"
        title="Activities"
        description="Stories, updates, awareness material and achievements from the district, its units and communities."
      />

      <PublicToolbar search={list.search} onSearchChange={list.setSearch} searchPlaceholder="Search articles...">
        <PublicFilterSelect
          value={list.filters.contentType ?? ''}
          onChange={(value) => list.setFilter('contentType', value)}
          options={TYPE_OPTIONS}
          label="Type"
        />
      </PublicToolbar>

      <PublicState
        loading={list.loading}
        error={list.error}
        isEmpty={list.items.length === 0}
        onRetry={list.refresh}
        emptyTitle="No articles published yet"
        emptyDescription="Published stories and updates will appear here."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.items.map((item) => (
            <Link
              key={item._id}
              to={`/content/${item.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-sm transition-colors hover:border-primary/40"
            >
              {item.coverImage ? (
                <img src={item.coverImage} alt="" loading="lazy" className="h-36 w-full object-cover" />
              ) : (
                <div className="flex h-36 items-center justify-center bg-slate-50 text-slate-300">
                  <FileText className="h-8 w-8" aria-hidden />
                </div>
              )}
              <div className="flex flex-1 flex-col p-3">
                <Badge tone="primary">{humanize(item.contentType)}</Badge>
                <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold text-secondary group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-3 flex-1 text-xs text-muted">{item.summary}</p>
                <p className="mt-2 text-xs text-muted">
                  {refName(item.unit) ?? refName(item.district) ?? 'Sunsari'}
                  {item.publishedAt ? ` - ${format(new Date(item.publishedAt), 'MMM d, yyyy')}` : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </PublicState>

      <PublicPagination meta={list.pagination} onPageChange={list.setPage} itemLabel="articles" />
    </div>
  );
}

export default ContentListPage;
