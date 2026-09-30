import { createListSlice } from '../../../../../shared/listSlice';
import { fetchAdministrators, fetchAdministratorById as fetchOneById } from '../services/administratorService';
import type { UserAccount } from '../../../../../types';

/**
 * Administrator list + detail state.
 * The thunks and reducer are generated from the shared list factory so every
 * feature exposes the same request-status contract.
 */
const slice = createListSlice<UserAccount>('districtAdmin.administrator', {
  fetchList: fetchAdministrators,
  fetchOne: fetchOneById,
});

export const fetchAdministratorList = slice.fetchList;
export const fetchAdministratorById = slice.fetchOne!;
export const { mutationStarted, mutationSucceeded, mutationFailed, selectedCleared, upserted, removed, reset } = slice.actions;
export default slice.reducer;
