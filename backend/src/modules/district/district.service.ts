import { ApiError } from '../../utils/ApiError';
import { buildPaginationMeta } from '../../utils/pagination';
import { isSuperAdmin, assertWithinScope } from '../../shared/scope';
import type { AuthUser } from '../../types/auth';
import type { ListResult } from '../../shared/BaseRepository';
import { RECORD_STATUS } from '../../constants/enums';
import { combineFilters } from '../../shared/queryFilters';
import { districtRepository } from './district.repository';
import type { DistrictDocument } from './district.model';

/** District scope is expressed on the document `_id` (districts are the scope root). */
export class DistrictService {
  private scopeFilter(user: AuthUser): Record<string, unknown> {
    if (isSuperAdmin(user)) return {};
    if (!user.district) throw ApiError.forbidden('Your account has no district assigned');
    return { _id: user.district };
  }

  async list(user: AuthUser, query: Record<string, unknown>): Promise<ListResult<DistrictDocument>> {
    const status = typeof query.status === 'string' && query.status ? { status: query.status } : {};
    return districtRepository.list(null, query, combineFilters(this.scopeFilter(user), status));
  }

  async getById(user: AuthUser, id: string): Promise<DistrictDocument> {
    if (!isSuperAdmin(user) && user.district !== id) {
      throw ApiError.forbidden('You can only access your assigned district');
    }
    const district = await districtRepository.findById(id);
    if (!district) throw ApiError.notFound('District not found');
    return district;
  }

  /** Primary district record — used by the public site and as the default scope. */
  async getPrimary(): Promise<DistrictDocument> {
    const active = await districtRepository.list(null, { limit: 1, sort: 'name', order: 'asc' }, {
      status: RECORD_STATUS.ACTIVE,
    });
    const first = active.items[0];
    if (!first) throw ApiError.notFound('No district has been configured yet');
    return first;
  }

  async update(
    user: AuthUser,
    id: string,
    payload: Record<string, unknown>,
  ): Promise<DistrictDocument> {
    const district = await this.getById(user, id);
    assertWithinScope(user, { district: String(district._id) }, 'district');
    const updated = await districtRepository.updateById(id, {
      ...payload,
      updatedBy: user.id,
    });
    if (!updated) throw ApiError.notFound('District not found');
    return updated;
  }

  async create(user: AuthUser, payload: Record<string, unknown>): Promise<DistrictDocument> {
    if (!isSuperAdmin(user)) throw ApiError.forbidden('Only a Super Admin can create a district');
    const existing = await districtRepository.findByCode(String(payload.code));
    if (existing) throw ApiError.conflict('A district with this code already exists');
    return districtRepository.create({ ...payload, createdBy: user.id, updatedBy: user.id });
  }

  /** Public district page payload. */
  async getPublicProfile(): Promise<DistrictDocument> {
    return this.getPrimary();
  }

  async paginationMeta(
    user: AuthUser,
    query: Record<string, unknown>,
  ): Promise<ReturnType<typeof buildPaginationMeta>> {
    const { meta } = await this.list(user, query);
    return meta;
  }
}

export const districtService = new DistrictService();
