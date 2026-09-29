import { ApiError } from '../../utils/ApiError';
import { ScopedCrudService } from '../../shared/ScopedCrudService';
import { unitRepository } from './unit.repository';
import type { UnitDocument } from './unit.model';

export class UnitService extends ScopedCrudService<UnitDocument> {
  constructor() {
    super({
      entityLabel: 'Unit',
      auditEntity: 'Unit',
      repository: unitRepository,
      buildListFilter: (query) => ({
        ...(typeof query.status === 'string' && query.status ? { status: query.status } : {}),
      }),
      prepareCreate: async (user, payload) => {
        const districtId = String(payload.district ?? user.district ?? '');
        if (!districtId) throw ApiError.badRequest('A district is required to create a unit');
        const existing = await unitRepository.findByCode(districtId, String(payload.code));
        if (existing) {
          throw ApiError.conflict('A unit with this code already exists in the district');
        }
        return { ...payload, district: districtId };
      },
      prepareUpdate: async (_user, existing, payload) => {
        if (typeof payload.code === 'string' && payload.code.toUpperCase() !== existing.code) {
          const duplicate = await unitRepository.findByCode(String(existing.district), payload.code);
          if (duplicate && String(duplicate._id) !== String(existing._id)) {
            throw ApiError.conflict('A unit with this code already exists in the district');
          }
        }
        return payload;
      },
      beforeRemove: async (_user, existing) => {
        const { memberRepository } = await import('../members/member.repository');
        const memberCount = await memberRepository.count(null, { unit: existing._id });
        if (memberCount > 0) {
          throw ApiError.conflict(
            'This unit still has members assigned. Reassign or archive them before deleting the unit.',
          );
        }
      },
    });
  }

  /** Lightweight option list used by pickers and filters. */
  async getOptions(filter: Record<string, unknown>) {
    return unitRepository.optionsForScope(filter);
  }
}

export const unitService = new UnitService();

