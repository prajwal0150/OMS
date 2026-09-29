import { createListSlice } from '../../../../shared/listSlice';
import { fetchMedia, fetchMediaById as fetchOneById } from '../services/mediaService';
import type { MediaItem } from '../../../../types';

/**
 * Media list + detail state.
 * The thunks and reducer are generated from the shared list factory so every
 * feature exposes the same request-status contract.
 */
const slice = createListSlice<MediaItem>('media', {
  fetchList: fetchMedia,
  fetchOne: fetchOneById,
});

export const fetchMediaList = slice.fetchList;
export const fetchMediaById = slice.fetchOne!;
export const { mutationStarted, mutationSucceeded, mutationFailed, selectedCleared, upserted, removed, reset } = slice.actions;
export default slice.reducer;
