import { createListSlice } from '../../../../../shared/listSlice';
import { createDistrict, fetchDistrictById, fetchDistricts, updateDistrict } from '../services/districtService';
import type { District } from '../../../../../types';

/** District list + detail state (the platform is seeded with Sunsari). */
const slice = createListSlice<District>('superAdmin.district', {
  fetchList: fetchDistricts,
  fetchOne: fetchDistrictById,
});

export const fetchDistrictList = slice.fetchList;
export const fetchDistrictDetail = slice.fetchOne!;
export const { mutationStarted, mutationSucceeded, mutationFailed, selectedCleared, upserted, removed, reset } = slice.actions;
export { createDistrict, updateDistrict };
export default slice.reducer;
