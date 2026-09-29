import { createListSlice } from '../../../../shared/listSlice';
import { fetchAnnouncements, fetchAnnouncementById as fetchOneById } from '../services/announcementService';
import type { Announcement } from '../../../../types';

/**
 * Announcement list + detail state.
 * The thunks and reducer are generated from the shared list factory so every
 * feature exposes the same request-status contract.
 */
const slice = createListSlice<Announcement>('announcement', {
  fetchList: fetchAnnouncements,
  fetchOne: fetchOneById,
});

export const fetchAnnouncementList = slice.fetchList;
export const fetchAnnouncementById = slice.fetchOne!;
export const { mutationStarted, mutationSucceeded, mutationFailed, selectedCleared, upserted, removed, reset } = slice.actions;
export default slice.reducer;
