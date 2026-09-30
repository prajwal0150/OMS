/**
 * Shared fixtures for the integration suites.
 *
 * Fixtures are written straight through the Mongoose models so a suite can
 * describe exactly the data it needs (districts, units, communities, members
 * and accounts) without depending on the demo seed script.
 */
import type { Application } from 'express';
import request from 'supertest';
import { createApp } from '../src/app';
import {
  ACCOUNT_STATUS,
  MEMBERSHIP_TYPE,
  MEMBER_STATUS,
  ORGANIZATION_NAME,
  ORGANIZATION_SHORT_NAME,
  RECORD_STATUS,
} from '../src/constants/enums';
import type { MemberStatus } from '../src/constants/enums';
import { PERMISSION_CATALOG } from '../src/constants/permissionCatalog';
import type { Permission } from '../src/constants/permissions';
import { ROLE_META, ROLE_NAMES } from '../src/constants/roles';
import type { RoleName } from '../src/constants/roles';
import { ROLE_PERMISSIONS } from '../src/constants/rolePermissions';
import { CommunityModel } from '../src/modules/communities/community.model';
import { DistrictModel } from '../src/modules/district/district.model';
import { MemberModel } from '../src/modules/members/member.model';
import { OrganizationModel } from '../src/modules/organization/organization.model';
import { PermissionModel } from '../src/modules/permissions/permission.model';
import { RoleModel } from '../src/modules/roles/role.model';
import { UnitModel } from '../src/modules/units/unit.model';
import { UserModel } from '../src/modules/users/user.model';
import { hashPassword } from '../src/utils/password';

export const app: Application = createApp();

export const PASSWORD = 'TestPass@2026';
export const SUPER_ADMIN_EMAIL = 'super.admin@hps.test';

let memberSequence = 0;
let unitSequence = 0;

/** Permissions, roles and the organization profile — required by every suite. */
export const seedFoundation = async (): Promise<void> => {
  await PermissionModel.insertMany(
    PERMISSION_CATALOG.map((entry) => ({
      key: entry.key,
      label: entry.label,
      module: entry.module,
      description: entry.description,
      isSystem: true,
    })),
  );

  for (const name of Object.values(ROLE_NAMES)) {
    const meta = ROLE_META[name];
    await RoleModel.create({
      name,
      label: meta.label,
      description: meta.description,
      permissions: ROLE_PERMISSIONS[name],
      rank: meta.rank,
      scopeType: meta.scopeType,
      status: RECORD_STATUS.ACTIVE,
      isSystem: true,
    });
  }

  await OrganizationModel.create({
    name: ORGANIZATION_NAME,
    shortName: ORGANIZATION_SHORT_NAME,
    slug: 'heavenly-path-sunsari',
    province: 'Koshi Province',
    country: 'Nepal',
    active: true,
  });
};

export interface DistrictFixture {
  id: string;
  name: string;
  code: string;
}

export const createDistrict = async (
  name: string,
  code: string,
  organizationId?: string,
): Promise<DistrictFixture> => {
  const district = await DistrictModel.create({
    name,
    code,
    province: 'Koshi Province',
    country: 'Nepal',
    ...(organizationId ? { organization: organizationId } : {}),
    status: RECORD_STATUS.ACTIVE,
  });
  return { id: String(district._id), name, code };
};

export const createUnit = async (
  districtId: string,
  name?: string,
  code?: string,
): Promise<string> => {
  unitSequence += 1;
  const unit = await UnitModel.create({
    name: name ?? `Unit ${unitSequence}`,
    code: code ?? `U-${unitSequence}`,
    district: districtId,
    status: RECORD_STATUS.ACTIVE,
  });
  return String(unit._id);
};

export const createCommunity = async (
  districtId: string,
  code: string,
  unitId?: string,
): Promise<string> => {
  const community = await CommunityModel.create({
    name: `Community ${code}`,
    code,
    district: districtId,
    ...(unitId ? { unit: unitId } : {}),
    status: RECORD_STATUS.ACTIVE,
  });
  return String(community._id);
};

export interface MemberFixtureOptions {
  district: string;
  unit?: string;
  communities?: string[];
  firstName?: string;
  lastName?: string;
  status?: MemberStatus;
  gender?: string;
  membershipType?: string;
  createdBy?: string;
}

export const createMember = async (
  options: MemberFixtureOptions,
): Promise<{ id: string; memberId: string }> => {
  memberSequence += 1;
  const memberId = `TEST-M-${String(memberSequence).padStart(5, '0')}`;
  const member = await MemberModel.create({
    memberId,
    firstName: options.firstName ?? `Member${memberSequence}`,
    lastName: options.lastName ?? 'Fixture',
    district: options.district,
    ...(options.unit ? { unit: options.unit } : {}),
    communities: options.communities ?? [],
    membershipType: options.membershipType ?? MEMBERSHIP_TYPE.REGULAR,
    status: options.status ?? MEMBER_STATUS.ACTIVE,
    joinedDate: new Date(),
    ...(options.gender ? { gender: options.gender } : {}),
    ...(options.createdBy ? { createdBy: options.createdBy } : {}),
  });
  return { id: String(member._id), memberId };
};

export interface UserFixtureOptions {
  email: string;
  role: RoleName;
  password?: string;
  firstName?: string;
  lastName?: string;
  district?: string;
  unit?: string;
  community?: string;
  member?: string;
  status?: string;
  permissions?: Permission[];
}

export const createUser = async (options: UserFixtureOptions): Promise<string> => {
  const user = await UserModel.create({
    firstName: options.firstName ?? 'Test',
    lastName: options.lastName ?? options.role,
    email: options.email.toLowerCase().trim(),
    passwordHash: await hashPassword(options.password ?? PASSWORD),
    role: options.role,
    permissions: options.permissions ?? [],
    ...(options.district ? { district: options.district } : {}),
    ...(options.unit ? { unit: options.unit } : {}),
    ...(options.community ? { community: options.community } : {}),
    ...(options.member ? { member: options.member } : {}),
    status: options.status ?? ACCOUNT_STATUS.ACTIVE,
    forcePasswordChange: false,
  });
  return String(user._id);
};

/** Signs in and returns the access token (throws when the sign in fails). */
export const login = async (email: string, password: string = PASSWORD): Promise<string> => {
  const response = await request(app).post('/api/auth/login').send({ email, password });
  if (response.status !== 200) {
    throw new Error(
      `Sign in failed for ${email} (${response.status}): ${JSON.stringify(response.body)}`,
    );
  }
  return response.body.data.accessToken as string;
};

export const bearer = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
});

/** Collects a binary response body so PDF/Excel payloads can be asserted. */
export const binaryParser = (
  response: NodeJS.ReadableStream,
  callback: (error: Error | null, body?: Buffer) => void,
): void => {
  const chunks: Buffer[] = [];
  response.on('data', (chunk: Buffer | string) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  response.on('end', () => callback(null, Buffer.concat(chunks)));
};
