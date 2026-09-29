import { useListQuery, type UseListQueryOptions, type UseListQueryResult } from '../../../../shared/useListQuery';
import type { DocumentFile } from '../../../../types';
import { fetchDocumentList } from '../redux/documentThunk';
import { useAppSelector } from '../../../../store/hooks';
import {
  selectDocumentError,
  selectDocumentItems,
  selectDocumentLoading,
  selectDocumentPagination,
} from '../redux/documentSelector';

export interface UseDocumentsResult extends UseListQueryResult {
  items: DocumentFile[];
  loading: boolean;
  error: string | null;
  pagination: ReturnType<typeof selectDocumentPagination>;
}

/** Single hook every Document list screen uses: query state + store state. */
export function useDocuments(options: UseListQueryOptions = {}): UseDocumentsResult {
  const query = useListQuery(fetchDocumentList, options);
  const items = useAppSelector(selectDocumentItems);
  const loading = useAppSelector(selectDocumentLoading);
  const error = useAppSelector(selectDocumentError);
  const pagination = useAppSelector(selectDocumentPagination);
  return { ...query, items, loading, error, pagination };
}
