/**
 * Database-backed roles. These string keys are stored on the Role documents,
 * therefore the identifiers must stay stable.
 */
export const ROLE_NAMES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DISTRICT_ADMIN: 'DISTRICT_ADMIN',
  DISTRICT_COMMITTEE_MEMBER: 'DISTRICT_COMMITTEE_MEMBER',
  UNIT_ADMIN: 'UNIT_ADMIN',
  UNIT_COMMITTEE_MEMBER: 'UNIT_COMMITTEE_MEMBER',
  COMMUNITY_COORDINATOR: 'COMMUNITY_COORDINATOR',
  COMMITTEE_MEMBER: 'COMMITTEE_MEMBER',
  MEMBER: 'MEMBER',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

export const ALL_ROLE_NAMES = Object.values(ROLE_NAMES) as RoleName[];

interface RoleMeta {
  label: string;
  description: string;
  /** Lower rank == broader authority. Used for guard rails (an admin can never manage a broader role). */
  rank: number;
  scopeType: 'ORGANIZATION' | 'DISTRICT' | 'UNIT' | 'COMMUNITY' | 'COMMITTEE' | 'SELF';
  isAdministrator: boolean;
}

export const ROLE_META: Record<RoleName, RoleMeta> = {
  SUPER_ADMIN: {
    label: 'Super Administrator',
    description: 'Full control over the organization, districts, units and administration.',
    rank: 1,
    scopeType: 'ORGANIZATION',
    isAdministrator: true,
  },
  DISTRICT_ADMIN: {
    label: 'District Administrator',
    description: 'Administers every unit, community, committee and member of a single district.',
    rank: 2,
    scopeType: 'DISTRICT',
    isAdministrator: true,
  },
  DISTRICT_COMMITTEE_MEMBER: {
    label: 'District Committee Member',
    description: 'District committee member with district wide read access and content authoring.',
    rank: 3,
    scopeType: 'DISTRICT',
    isAdministrator: true,
  },
  UNIT_ADMIN: {
    label: 'Unit Administrator',
    description: 'Administers a single organizational unit.',
    rank: 3,
    scopeType: 'UNIT',
    isAdministrator: true,
  },
  UNIT_COMMITTEE_MEMBER: {
    label: 'Unit Committee Member',
    description: 'Unit committee member with unit level read access and content authoring.',
    rank: 4,
    scopeType: 'UNIT',
    isAdministrator: true,
  },
  COMMUNITY_COORDINATOR: {
    label: 'Community Coordinator',
    description: 'Coordinates a single community (optionally inside one unit).',
    rank: 5,
    scopeType: 'COMMUNITY',
    isAdministrator: true,
  },
  COMMITTEE_MEMBER: {
    label: 'Committee Member',
    description: 'Member of a committee with read access to their committee scope.',
    rank: 6,
    scopeType: 'COMMITTEE',
    isAdministrator: false,
  },
  MEMBER: {
    label: 'Member',
    description: 'Organization member with access to the member portal only.',
    rank: 7,
    scopeType: 'SELF',
    isAdministrator: false,
  },
};

/** Roles that an administrator may never manage through the admin API. */
export const ADMINISTRATOR_ROLES: RoleName[] = ALL_ROLE_NAMES.filter(
  (role) => ROLE_META[role].isAdministrator,
);

export const getRoleRank = (role: RoleName): number => ROLE_META[role]?.rank ?? 99;
