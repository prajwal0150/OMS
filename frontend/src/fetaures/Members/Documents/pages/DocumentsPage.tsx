import { format } from 'date-fns';
import { Download, FolderOpen } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
} from '../../../../components/ui';
import { formatBytes } from '../../../Admin/Documents/services/documentService';
import { registerDownload } from '../../../Admin/Documents/services/documentService';
import { MemberToolbar } from '../../components/MemberToolbar';
import { usePortalList } from '../../hooks/usePortalData';
import { fetchMyDocuments } from '../../services/memberPortalService';
import { humanize, type DocumentFile } from '../../../../types';

export function MemberDocumentsPage() {
  const { items, pagination, loading, error, setPage, search, setSearch, refresh } =
    usePortalList<DocumentFile>(fetchMyDocuments);

  const open = (document: DocumentFile) => {
    if (!document.file?.url) return;
    // Record the download server-side, then open the stored file.
    void registerDownload(document._id);
    window.open(document.file.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      <MemberToolbar
        title="Documents"
        description="Minutes, reports, notices and guidelines you have access to."
        search={search}
        onSearchChange={setSearch}
      />

      {error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card padding="none">
          <EmptyState
            title="No documents"
            description="Documents shared with your unit or community will appear here."
            icon={<FolderOpen className="h-5 w-5" />}
          />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-white shadow-sm">
          <table className="app-table">
            <thead>
              <tr>
                <th scope="col">Document</th>
                <th scope="col">Category</th>
                <th scope="col" className="hidden md:table-cell">
                  Date
                </th>
                <th scope="col" className="hidden lg:table-cell">
                  Size
                </th>
                <th scope="col" className="text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((document) => (
                <tr key={document._id}>
                  <td>
                    <p className="font-medium text-slate-800">{document.title}</p>
                    {document.description && (
                      <p className="line-clamp-1 text-xs text-muted">{document.description}</p>
                    )}
                  </td>
                  <td>
                    <Badge tone="primary">{humanize(document.category)}</Badge>
                  </td>
                  <td className="hidden whitespace-nowrap text-slate-600 md:table-cell">
                    {document.date ? format(new Date(document.date), 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="hidden text-xs text-slate-600 lg:table-cell">
                    {formatBytes(document.file?.size)}
                  </td>
                  <td className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => open(document)}
                      leftIcon={<Download className="h-3.5 w-3.5" />}
                    >
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination meta={pagination?.pagination} onPageChange={setPage} itemLabel="documents" />
    </div>
  );
}

export default MemberDocumentsPage;
