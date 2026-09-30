import { createListSlice } from '../../../../../shared/listSlice';
import { fetchCommittees, fetchCommitteeById as fetchOneById } from '../services/committeeService';
import type { Committee } from '../../../../../types';

/**
 * Committee list + detail state.
 * The thunks and reducer are generated from the shared list factory so every
 * feature exposes the same request-status contract.
 */
const slice = createListSlice<Committee>('unitAdmin.committee', {
  fetchList: fetchCommittees,
  fetchOne: fetchOneById,
});

export const fetchCommitteeList = slice.fetchList;
export const fetchCommitteeById = slice.fetchOne!;
export const { mutationStarted, mutationSucceeded, mutationFailed, selectedCleared, upserted, removed, reset } = slice.actions;
export default slice.reducer;
