import { MEMBER_ID_PADDING } from '../../constants/enums';
import { nextSequence } from '../../shared/Counter';
import { districtRepository } from '../district/district.repository';

/**
 * Generates unique, human readable member identifiers: HPS-SUN-00001.
 * The district code segment keeps identifiers meaningful across districts.
 */
export const generateMemberId = async (districtId: string): Promise<string> => {
  const district = await districtRepository.findById(districtId);
  const code = (district?.code ?? 'SUN').toUpperCase();
  const sequence = await nextSequence('memberId');
  return `HPS-${code}-${String(sequence).padStart(MEMBER_ID_PADDING, '0')}`;
};
