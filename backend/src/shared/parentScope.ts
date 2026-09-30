/**
 * Second half of the scoping rule.
 *
 * `assertWithinScope` only compares the district itself, so a unit, community or
 * committee attached to a record has to be verified separately: without it a
 * scoped administrator could pin a record to a parent of another district.
 */
import { refId } from '../utils/strings';
import { ApiError } from '../utils/ApiError';
import { unitRepository } from '../modules/units/unit.repository';
import { communityRepository } from '../modules/communities/community.repository';
import { committeeRepository } from '../modules/committees/committee.repository';

export interface ParentRefs {
  unit?: string;
  community?: string;
  committee?: string;
}

/** Throws `400` when a parent reference points outside the given district. */
export const assertParentsInDistrict = async (
  districtId: string | undefined,
  parents: ParentRefs,
): Promise<void> => {
  if (!districtId) return;

  for (const parent of ['unit', 'community', 'committee'] as const) {
    const id = parents[parent];
    if (!id) continue;

    let found: { district?: unknown } | null = null;
    if (parent === 'unit') found = await unitRepository.findById(id);
    if (parent === 'community') found = await communityRepository.findById(id);
    if (parent === 'committee') found = await committeeRepository.findById(id);

    if (!found || refId(found.district as never) !== districtId) {
      throw ApiError.badRequest(`The selected ${parent} does not belong to this district`);
    }
  }
};
