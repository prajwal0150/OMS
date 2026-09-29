import { Types } from 'mongoose';
import { ApiError } from '../../utils/ApiError';
import { slugify } from '../../utils/strings';
import { ORGANIZATION_NAME, ORGANIZATION_SHORT_NAME } from '../../constants/enums';
import { organizationRepository } from './organization.repository';
import type { OrganizationDocument } from './organization.model';
import type { AuthUser } from '../../types/auth';

/** The organization profile is a single record; it is created automatically when missing. */
export class OrganizationService {
  async getProfile(): Promise<OrganizationDocument> {
    const existing = await organizationRepository.getSingleton();
    if (existing) return existing;
    return this.ensureProfile();
  }

  async ensureProfile(partial: Record<string, unknown> = {}): Promise<OrganizationDocument> {
    const created = await organizationRepository.create({
      name: ORGANIZATION_NAME,
      shortName: ORGANIZATION_SHORT_NAME,
      slug: slugify(ORGANIZATION_NAME),
      province: 'Koshi Province',
      country: 'Nepal',
      active: true,
      ...partial,
    });
    return created;
  }

  async updateProfile(
    user: AuthUser,
    data: Record<string, unknown>,
  ): Promise<OrganizationDocument> {
    const current = await this.getProfile();
    const update: Record<string, unknown> = { ...data, updatedBy: new Types.ObjectId(user.id) };
    if (typeof data.name === 'string' && data.name !== current.name) {
      update.slug = slugify(data.name);
    }
    const updated = await organizationRepository.updateSingleton(update);
    if (!updated) throw ApiError.notFound('Organization profile not found');
    return updated;
  }

  /** Public branding payload used by the public website. */
  async getPublicProfile() {
    const profile = await this.getProfile();
    return {
      id: String(profile._id),
      name: profile.name,
      shortName: profile.shortName,
      logo: profile.logo,
      description: profile.description,
      establishedDate: profile.establishedDate,
      province: profile.province,
      country: profile.country,
      address: profile.address,
      phone: profile.phone,
      email: profile.email,
      website: profile.website,
      socialLinks: profile.socialLinks,
    };
  }
}

export const organizationService = new OrganizationService();
