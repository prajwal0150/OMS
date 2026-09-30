import { createListSlice } from '../../../../../shared/listSlice';
import { fetchMembers, fetchMemberById as fetchOneById } from '../services/memberService';
import type { Member } from '../../../../../types';

/**
 * Member list + detail state.
 * The thunks and reducer are generated from the shared list factory so every
 * feature exposes the same request-status contract.
 */
const slice = createListSlice<Member>('districtAdmin.member', {
  fetchList: fetchMembers,
  fetchOne: fetchOneById,
});

export const fetchMemberList = slice.fetchList;
export const fetchMemberById = slice.fetchOne!;
export const { mutationStarted, mutationSucceeded, mutationFailed, selectedCleared, upserted, removed, reset } = slice.actions;
export default slice.reducer;
