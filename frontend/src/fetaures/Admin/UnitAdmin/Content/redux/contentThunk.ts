import { createListSlice } from '../../../../../shared/listSlice';
import { fetchContent, fetchContentById as fetchOneById } from '../services/contentService';
import type { ContentRecord } from '../../../../../types';

/**
 * Content list + detail state.
 * The thunks and reducer are generated from the shared list factory so every
 * feature exposes the same request-status contract.
 */
const slice = createListSlice<ContentRecord>('unitAdmin.content', {
  fetchList: fetchContent,
  fetchOne: fetchOneById,
});

export const fetchContentList = slice.fetchList;
export const fetchContentById = slice.fetchOne!;
export const { mutationStarted, mutationSucceeded, mutationFailed, selectedCleared, upserted, removed, reset } = slice.actions;
export default slice.reducer;
