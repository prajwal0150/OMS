/**
 * Database seed — roles, permissions, organization profile, super admin and
 * (optionally) a demo dataset. Idempotent: safe to run multiple times.
 *
 *   npm run seed
 */
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { env } from '../src/config/env';
import {
  COMMUNITY_TARGET_GROUP,
  CONTENT_STATUS,
  CONTENT_TYPE,
  DEFAULT_COUNTRY,
  DEFAULT_DISTRICT_NAME,
  DEFAULT_PROVINCE,
  EVENT_LEVEL,
  EVENT_STATUS,
  EVENT_TYPE,
  MEMBERSHIP_TYPE,
  MEMBER_STATUS,
  ORGANIZATION_NAME,
  ORGANIZATION_SHORT_NAME,
  RECORD_STATUS,
  TARGET_TYPE,
  VISIBILITY,
} from '../src/constants/enums';
import { PERMISSION_CATALOG } from '../src/constants/permissionCatalog';
import { ROLE_META, ROLE_NAMES } from '../src/constants/roles';
import { ROLE_PERMISSIONS } from '../src/constants/rolePermissions';
import { PermissionModel } from '../src/modules/permissions/permission.model';
import { RoleModel } from '../src/modules/roles/role.model';
import { OrganizationModel } from '../src/modules/organization/organization.model';
import { UserModel } from '../src/modules/users/user.model';
import { DistrictModel } from '../src/modules/district/district.model';
import { UnitModel } from '../src/modules/units/unit.model';
import { CommunityModel } from '../src/modules/communities/community.model';
import { CommitteeModel } from '../src/modules/committees/committee.model';
import { MemberModel } from '../src/modules/members/member.model';
import { EventModel } from '../src/modules/events/event.model';
import { ContentModel } from '../src/modules/content/content.model';
import { AnnouncementModel } from '../src/modules/announcements/announcement.model';
import { hashPassword } from '../src/utils/password';

/* eslint-disable no-console */

const seedPermissions = async (): Promise<number> => {
  let count = 0;
  for (const entry of PERMISSION_CATALOG) {
    await PermissionModel.updateOne(
      { key: entry.key },
      { $setOnInsert: { ...entry, isSystem: true } },
      { upsert: true },
    );
    count += 1;
  }
  return count;
};

const seedRoles = async (): Promise<number> => {
  let count = 0;
  for (const name of Object.values(ROLE_NAMES)) {
    const meta = ROLE_META[name];
    await RoleModel.updateOne(
      { name },
      {
        $setOnInsert: {
          name,
          label: meta.label,
          description: meta.description,
          permissions: ROLE_PERMISSIONS[name],
          rank: meta.rank,
          scopeType: meta.scopeType,
          isSystem: true,
          status: RECORD_STATUS.ACTIVE,
        },
      },
      { upsert: true },
    );
    count += 1;
  }
  return count;
};

const seedOrganization = async () => {
  const org = await OrganizationModel.findOne({ slug: 'heavenly-path-sunsari-district' });
  if (org) return org;
  return OrganizationModel.create({
    name: ORGANIZATION_NAME,
    shortName: ORGANIZATION_SHORT_NAME,
    slug: 'heavenly-path-sunsari-district',
    description:
      'HEAVENLY PATH SUNSARI DISTRICT — a community organization managing districts, units, communities, committees and members.',
    province: DEFAULT_PROVINCE,
    country: DEFAULT_COUNTRY,
    active: true,
  });
};

const seedSuperAdmin = async () => {
  // Credentials come from the environment only — never hardcoded. A Super Admin is
  // provisioned once, and the operator is forced to set their own password on first login.
  const email = (env.SUPER_ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = env.SUPER_ADMIN_PASSWORD ?? '';

  const existingSuperAdmin = await UserModel.findOne({ role: ROLE_NAMES.SUPER_ADMIN });
  if (existingSuperAdmin) return existingSuperAdmin;

  if (!email || !password) {
    throw new Error(
      'No Super Admin exists yet. Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in backend/.env, then run the seed again.',
    );
  }

  return UserModel.create({
    firstName: env.SUPER_ADMIN_FIRST_NAME,
    lastName: env.SUPER_ADMIN_LAST_NAME,
    email,
    passwordHash: await hashPassword(password),
    role: ROLE_NAMES.SUPER_ADMIN,
    permissions: [],
    status: 'ACTIVE',
    // The seeded account must set its own password on first sign-in.
    forcePasswordChange: true,
    isSystemAccount: true,
  });
};

interface DemoContext {
  districtId: string;
  unitIds: string[];
  communityIds: string[];
}

/**
 * Seeds the organizational structure that the platform cannot function without:
 * the district, its four units and the three communities. Idempotent.
 */
const seedStructure = async (orgId: string, superAdminId: string): Promise<DemoContext> => {
  let district = await DistrictModel.findOne({ code: 'SUN' });
  if (!district) {
    district = await DistrictModel.create({
      name: DEFAULT_DISTRICT_NAME,
      code: 'SUN',
      province: DEFAULT_PROVINCE,
      country: DEFAULT_COUNTRY,
      description: 'Sunsari district chapter of HEAVENLY PATH.',
      organization: orgId,
      status: RECORD_STATUS.ACTIVE,
      createdBy: superAdminId,
    });
  }

  const unitSeed = [
    { name: 'Itahari', code: 'ITA', location: 'Itahari, Sunsari' },
    { name: 'Dharan', code: 'DHR', location: 'Dharan, Sunsari' },
    { name: 'Barahachhhetra', code: 'BRH', location: 'Barahachhhetra, Sunsari' },
    { name: 'Saune', code: 'SAU', location: 'Saune, Sunsari' },
  ];
  const unitIds: string[] = [];
  for (const seed of unitSeed) {
    const existing = await UnitModel.findOne({ code: seed.code, district: district._id });
    const unit =
      existing ??
      (await UnitModel.create({
        ...seed,
        district: district._id,
        organization: orgId,
        status: RECORD_STATUS.ACTIVE,
        createdBy: superAdminId,
      }));
    unitIds.push(String(unit._id));
  }

  const communitySeed = [
    { name: 'Parents Community', code: 'PAR', targetGroup: COMMUNITY_TARGET_GROUP.PARENTS },
    { name: 'Women Community', code: 'WMN', targetGroup: COMMUNITY_TARGET_GROUP.WOMEN },
    { name: 'Youth Community', code: 'YTH', targetGroup: COMMUNITY_TARGET_GROUP.YOUTH },
  ];
  const communityIds: string[] = [];
  for (const seed of communitySeed) {
    const existing = await CommunityModel.findOne({ code: seed.code, district: district._id });
    const community =
      existing ??
      (await CommunityModel.create({
        ...seed,
        district: district._id,
        organization: orgId,
        status: RECORD_STATUS.ACTIVE,
        createdBy: superAdminId,
      }));
    communityIds.push(String(community._id));
  }

  return { districtId: String(district._id), unitIds, communityIds };
};

/** Sample committees — only created when the demo dataset is explicitly enabled. */
const seedDemoCommittees = async (
  context: DemoContext,
  orgId: string,
  superAdminId: string,
): Promise<void> => {
  const committeeSeed = [
    {
      name: 'Sunsari District Executive Committee',
      level: 'DISTRICT' as const,
      unit: undefined,
    },
    { name: 'Itahari Unit Committee', level: 'UNIT' as const, unit: context.unitIds[0] },
    { name: 'Dharan Unit Committee', level: 'UNIT' as const, unit: context.unitIds[1] },
    {
      name: 'Barahachhhetra Unit Committee',
      level: 'UNIT' as const,
      unit: context.unitIds[2],
    },
    { name: 'Saune Unit Committee', level: 'UNIT' as const, unit: context.unitIds[3] },
    {
      name: 'Youth Community Committee',
      level: 'COMMUNITY' as const,
      unit: context.unitIds[1],
      community: context.communityIds[2],
    },
  ];

  for (const seed of committeeSeed) {
    const existing = await CommitteeModel.findOne({ name: seed.name, district: context.districtId });
    if (existing) continue;
    await CommitteeModel.create({
      name: seed.name,
      level: seed.level,
      district: context.districtId,
      ...(seed.unit ? { unit: seed.unit } : {}),
      ...(seed.community ? { community: seed.community } : {}),
      organization: orgId,
      status: RECORD_STATUS.ACTIVE,
      startDate: new Date(),
      createdBy: superAdminId,
    });
  }
};

const seedDemoMembers = async (
  context: DemoContext,
  orgId: string,
  superAdminId: string,
): Promise<void> => {
  const memberCount = await MemberModel.countDocuments({ district: context.districtId });
  if (memberCount > 0) return;

  const demoMembers = [
    { firstName: 'Ramesh', lastName: 'Karki', gender: 'MALE' as const },
    { firstName: 'Sita', lastName: 'Sharma', gender: 'FEMALE' as const },
    { firstName: 'Hari', lastName: 'Prasad', gender: 'MALE' as const },
    { firstName: 'Gita', lastName: 'Thapa', gender: 'FEMALE' as const },
    { firstName: 'Bikash', lastName: 'Rai', gender: 'MALE' as const },
    { firstName: 'Anita', lastName: 'Gurung', gender: 'FEMALE' as const },
  ];
  let sequence = 0;
  for (const seed of demoMembers) {
    sequence += 1;
    await MemberModel.create({
      memberId: `HPS-SUN-${String(sequence).padStart(5, '0')}`,
      ...seed,
      phone: `98${String(10000000 + sequence).slice(0, 8)}`,
      joinedDate: new Date(),
      organization: orgId,
      district: context.districtId,
      unit: context.unitIds[sequence % context.unitIds.length],
      communities: [context.communityIds[sequence % context.communityIds.length]],
      committeePositions: [],
      membershipType: sequence % 3 === 0 ? MEMBERSHIP_TYPE.COMMITTEE : MEMBERSHIP_TYPE.REGULAR,
      status: MEMBER_STATUS.ACTIVE,
      createdBy: superAdminId,
    });
  }
};

const seedDemoActivity = async (
  context: DemoContext,
  orgId: string,
  superAdminId: string,
): Promise<void> => {
  const eventCount = await EventModel.countDocuments({ district: context.districtId });
  if (eventCount === 0) {
    const now = new Date();
    const demoEvents = [
      {
        title: 'District General Meeting',
        type: EVENT_TYPE.MEETING,
        status: EVENT_STATUS.COMPLETED,
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Youth Leadership Training',
        type: EVENT_TYPE.TRAINING,
        status: EVENT_STATUS.SCHEDULED,
        startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Community Clean-up Campaign',
        type: EVENT_TYPE.SOCIAL_SERVICE,
        status: EVENT_STATUS.SCHEDULED,
        startDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    ];
    for (const seed of demoEvents) {
      await EventModel.create({
        ...seed,
        level: EVENT_LEVEL.DISTRICT,
        location: `${DEFAULT_DISTRICT_NAME} Community Hall`,
        organizer: ORGANIZATION_SHORT_NAME,
        district: context.districtId,
        organization: orgId,
        createdBy: superAdminId,
      });
    }
  }

  const contentCount = await ContentModel.countDocuments({ district: context.districtId });
  if (contentCount === 0) {
    const now = new Date();
    const demoContent = [
      {
        title: 'Welcome to HEAVENLY PATH SUNSARI',
        slug: 'welcome-to-heavenly-path-sunsari',
        summary: 'An introduction to our organization, mission and community.',
        contentType: CONTENT_TYPE.NEWS,
      },
      {
        title: 'District Meeting Highlights',
        slug: 'district-meeting-highlights',
        summary: 'Key outcomes from the latest district general meeting.',
        contentType: CONTENT_TYPE.MEETING_REPORT,
      },
    ];
    for (const seed of demoContent) {
      await ContentModel.create({
        ...seed,
        content: `${seed.summary}\n\nThis article was seeded for demonstration purposes.`,
        visibility: VISIBILITY.PUBLIC,
        status: CONTENT_STATUS.PUBLISHED,
        publishedAt: now,
        district: context.districtId,
        organization: orgId,
        views: 0,
        tags: [],
        gallery: [],
        videos: [],
        documents: [],
        createdBy: superAdminId,
        publishedBy: superAdminId,
      });
    }
  }

  const announcementCount = await AnnouncementModel.countDocuments({
    district: context.districtId,
  });
  if (announcementCount === 0) {
    await AnnouncementModel.create({
      title: 'Welcome to the new OMS platform',
      content: 'We are excited to launch our new Organization Management System!',
      targetType: TARGET_TYPE.DISTRICT,
      district: context.districtId,
      organization: orgId,
      publishDate: new Date(),
      status: RECORD_STATUS.ACTIVE,
      isPublic: true,
      selectedMembers: [],
      createdBy: superAdminId,
    });
  }
};

const seedDemoAdmins = async (context: DemoContext, superAdminId: string): Promise<void> => {
  const districtAdminCount = await UserModel.countDocuments({
    email: 'districtadmin@heavenlypath.org',
  });
  if (districtAdminCount === 0) {
    await UserModel.create({
      firstName: 'District',
      lastName: 'Administrator',
      email: 'districtadmin@heavenlypath.org',
      passwordHash: await hashPassword('ChangeMe@2026'),
      role: ROLE_NAMES.DISTRICT_ADMIN,
      permissions: [],
      district: context.districtId,
      status: 'ACTIVE',
      forcePasswordChange: false,
      createdBy: superAdminId,
    });
  }

  const unitAdminCount = await UserModel.countDocuments({ email: 'unitadmin@heavenlypath.org' });
  if (unitAdminCount === 0) {
    await UserModel.create({
      firstName: 'Unit',
      lastName: 'Administrator',
      email: 'unitadmin@heavenlypath.org',
      passwordHash: await hashPassword('ChangeMe@2026'),
      role: ROLE_NAMES.UNIT_ADMIN,
      permissions: [],
      district: context.districtId,
      unit: context.unitIds[0],
      status: 'ACTIVE',
      forcePasswordChange: false,
      createdBy: superAdminId,
    });
  }
};

const run = async () => {
  console.log('[seed] connecting…');
  await connectDatabase();

  try {
    const permissions = await seedPermissions();
    console.log(`[seed] permissions: ${permissions}`);

    const roles = await seedRoles();
    console.log(`[seed] roles: ${roles}`);

    const org = await seedOrganization();
    console.log(`[seed] organization: ${org.name}`);

    const superAdmin = await seedSuperAdmin();
    console.log(`[seed] super admin: ${superAdmin.email}`);

    // Structural seed — always runs so the platform is usable straight after setup.
    const context = await seedStructure(String(org._id), String(superAdmin._id));
    console.log(
      `[seed] structure: district=${context.districtId} units=${context.unitIds.length} communities=${context.communityIds.length}`,
    );

    if (env.SEED_DEMO_DATA) {
      await seedDemoCommittees(context, String(org._id), String(superAdmin._id));
      await seedDemoMembers(context, String(org._id), String(superAdmin._id));
      await seedDemoActivity(context, String(org._id), String(superAdmin._id));
      await seedDemoAdmins(context, String(superAdmin._id));
      console.log('[seed] demo dataset ready (SEED_DEMO_DATA=true)');
      console.log('[seed] demo logins — all use the temporary password "ChangeMe@2026":');
      console.log(`  super admin:     ${env.SUPER_ADMIN_EMAIL ?? '<from .env>'}`);
      console.log('  district admin:  districtadmin@heavenlypath.org');
      console.log('  unit admin:      unitadmin@heavenlypath.org');
    } else {
      console.log('[seed] SEED_DEMO_DATA=false — skipping the sample dataset');
    }

    console.log('[seed] done — sign in as the Super Admin and complete the forced password change');
  } finally {
    await disconnectDatabase();
  }
};

run().catch((error) => {
  console.error('[seed] failed', error);
  process.exit(1);
});





