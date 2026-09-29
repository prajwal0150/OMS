import { createListSlice } from '../../../../shared/listSlice';
import { fetchDocuments, fetchDocumentById as fetchOneById } from '../services/documentService';
import type { DocumentFile } from '../../../../types';

/**
 * Document list + detail state.
 * The thunks and reducer are generated from the shared list factory so every
 * feature exposes the same request-status contract.
 */
const slice = createListSlice<DocumentFile>('document', {
  fetchList: fetchDocuments,
  fetchOne: fetchOneById,
});

export const fetchDocumentList = slice.fetchList;
export const fetchDocumentById = slice.fetchOne!;
export const { mutationStarted, mutationSucceeded, mutationFailed, selectedCleared, upserted, removed, reset } = slice.actions;
export default slice.reducer;
