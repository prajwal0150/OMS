import { ResourceListPage } from '../../../../components';
import { Badge } from '../../../../components/ui';
import { formatBytes } from '../services/documentService';
import { format } from 'date-fns';import { enumOptions } from '../../../../hooks/useScopeOptions';
import { useDocuments } from '../hooks/useDocuments';
import { fetchDocumentList } from '../redux/documentThunk';
import type { DocumentFile } from '../../../../types';
import { DOCUMENT_CATEGORY, ENUM_LABELS, humanize } from '../../../../types';

export function DocumentsPage() {
  const { items, pagination, loading, error } = useDocuments();
  

  return (
    <ResourceListPage<DocumentFile>
      title="Documents"
      description="Meeting minutes, reports, notices, certificates and official documents."
      fetchList={fetchDocumentList}
      items={items}
      pagination={pagination}
      loading={loading}
      error={error}
      rowKey={(row) => row._id}
      defaultSort="date"
      itemLabel="documents"
      columns={[
        {
          key: 'title',
          header: 'Document',
          sortable: true,
          render: (row) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{row.title}</p>
              <p className="truncate text-xs text-muted">{row.file?.name ?? ''}</p>
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
          key: 'visibility',
          header: 'Visibility',
          priority: false,
          render: (row) => (
            <Badge tone={row.visibility === 'PUBLIC' ? 'info' : 'neutral'}>
              {humanize(row.visibility)}
            </Badge>
          ),
        },
        {
          key: 'fileSize',
          header: 'Size',
          priority: false,
          align: 'right',
          render: (row) => formatBytes(row.file?.size),
        },
        {
          key: 'downloadCount',
          header: 'Downloads',
          priority: false,
          align: 'right',
          render: (row) => row.downloadCount ?? 0,
        },
        {
          key: 'date',
          header: 'Date',
          sortable: true,
          render: (row) => (row.date ? format(new Date(row.date), 'MMM d, yyyy') : '—'),
        },
      ]}
      filters={[
        {
          name: 'category',
          label: 'Category',
          value: '',
          options: enumOptions(Object.values(DOCUMENT_CATEGORY), ENUM_LABELS),
        },
      ]}
      
    />
  );
}

export default DocumentsPage;
