import { ResourceListPage } from '../../../../components';
import { Badge } from '../../../../components/ui';
import { formatBytes } from '../services/mediaService';import { enumOptions } from '../../../../hooks/useScopeOptions';
import { useMedia } from '../hooks/useMedia';
import { fetchMediaList } from '../redux/mediaThunk';
import type { MediaItem } from '../../../../types';
import { ENUM_LABELS, MEDIA_CATEGORY, humanize } from '../../../../types';

export function MediaPage() {
  const { items, pagination, loading, error } = useMedia();
  

  return (
    <ResourceListPage<MediaItem>
      title="Media library"
      description="Images, videos and documents available to attach to content, events and announcements."
      fetchList={fetchMediaList}
      items={items}
      pagination={pagination}
      loading={loading}
      error={error}
      rowKey={(row) => row._id}
      defaultSort="createdAt"
      itemLabel="files"
      columns={[
        {
          key: 'preview',
          header: 'Preview',
          render: (row) =>
            row.category === 'IMAGE' ? (
              <img
                src={row.thumbnailUrl ?? row.storageUrl}
                alt=""
                loading="lazy"
                className="h-9 w-12 rounded-lg border border-line object-cover"
              />
            ) : (
              <span className="flex h-9 w-12 items-center justify-center rounded-lg border border-line text-[10px] font-medium text-muted">
                {humanize(row.category)}
              </span>
            ),
        },
        {
          key: 'originalName',
          header: 'File',
          sortable: true,
          render: (row) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{row.title ?? row.originalName}</p>
              <p className="truncate text-xs text-muted">{row.originalName}</p>
            </div>
          ),
        },
        {
          key: 'category',
          header: 'Category',
          sortable: true,
          render: (row) => <Badge tone="primary">{humanize(row.category)}</Badge>,
        },
        {
          key: 'fileSize',
          header: 'Size',
          priority: false,
          align: 'right',
          render: (row) => formatBytes(row.fileSize),
        },
        {
          key: 'createdAt',
          header: 'Uploaded',
          priority: false,
          sortable: true,
          render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'),
        },
      ]}
      filters={[
        {
          name: 'category',
          label: 'Category',
          value: '',
          options: enumOptions(Object.values(MEDIA_CATEGORY), ENUM_LABELS),
        },
      ]}
      
    />
  );
}

export default MediaPage;
