import { createListSlice } from '../../../../../shared/listSlice';
import { fetchEvents, fetchEventById as fetchOneById } from '../services/eventService';
import type { EventRecord } from '../../../../../types';

/**
 * Event list + detail state.
 * The thunks and reducer are generated from the shared list factory so every
 * feature exposes the same request-status contract.
 */
const slice = createListSlice<EventRecord>('superAdmin.event', {
  fetchList: fetchEvents,
  fetchOne: fetchOneById,
});

export const fetchEventList = slice.fetchList;
export const fetchEventById = slice.fetchOne!;
export const { mutationStarted, mutationSucceeded, mutationFailed, selectedCleared, upserted, removed, reset } = slice.actions;
export default slice.reducer;
