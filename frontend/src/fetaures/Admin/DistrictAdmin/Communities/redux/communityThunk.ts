import { createListSlice } from '../../../../../shared/listSlice';
import { fetchCommunities, fetchCommunityById as fetchOneById } from '../services/communityService';
import type { Community } from '../../../../../types';

/**
 * Community list + detail state.
 * The thunks and reducer are generated from the shared list factory so every
 * feature exposes the same request-status contract.
 */
const slice = createListSlice<Community>('districtAdmin.communitie', {
  fetchList: fetchCommunities,
  fetchOne: fetchOneById,
});

export const fetchCommunityList = slice.fetchList;
export const fetchCommunityById = slice.fetchOne!;
export const { mutationStarted, mutationSucceeded, mutationFailed, selectedCleared, upserted, removed, reset } = slice.actions;
export default slice.reducer;
