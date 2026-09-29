import { createListSlice } from '../../../../shared/listSlice';
import { fetchUnits, fetchUnitById as fetchOneById } from '../services/unitService';
import type { Unit } from '../../../../types';

/**
 * Unit list + detail state.
 * The thunks and reducer are generated from the shared list factory so every
 * feature exposes the same request-status contract.
 */
const slice = createListSlice<Unit>('unit', {
  fetchList: fetchUnits,
  fetchOne: fetchOneById,
});

export const fetchUnitList = slice.fetchList;
export const fetchUnitById = slice.fetchOne!;
export const { mutationStarted, mutationSucceeded, mutationFailed, selectedCleared, upserted, removed, reset } = slice.actions;
export default slice.reducer;
