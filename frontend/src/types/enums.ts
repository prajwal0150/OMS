/** Enumerations mirroring `backend/src/constants` - these keys are stored in MongoDB. */

export const ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DISTRICT_ADMIN: 'DISTRICT_ADMIN',
  DISTRICT_COMMITTEE_MEMBER: 'DISTRICT_COMMITTEE_MEMBER',
  UNIT_ADMIN: 'UNIT_ADMIN',
  UNIT_COMMITTEE_MEMBER: 'UNIT_COMMITTEE_MEMBER',
  COMMUNITY_COORDINATOR: 'COMMUNITY_COORDINATOR',
  COMMITTEE_MEMBER: 'COMMITTEE_MEMBER',
  MEMBER: 'MEMBER',
} as const;
export type RoleName = (typeof ROLE)[keyof typeof ROLE];

export const ROLE_LABEL: Record<RoleName, string> = {
  SUPER_ADMIN: 'Super Admin',
  DISTRICT_ADMIN: 'District Admin',
  DISTRICT_COMMITTEE_MEMBER: 'District Committee',
  UNIT_ADMIN: 'Unit Admin',
  UNIT_COMMITTEE_MEMBER: 'Unit Committee',
  COMMUNITY_COORDINATOR: 'Community Coordinator',
  COMMITTEE_MEMBER: 'Committee Member',
  MEMBER: 'Member',
};

export const ACCOUNT_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

export const RECORD_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type RecordStatus = (typeof RECORD_STATUS)[keyof typeof RECORD_STATUS];

export const MEMBER_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

export const MEMBERSHIP_TYPE = {
  REGULAR: 'REGULAR',
  COMMITTEE: 'COMMITTEE',
  COORDINATOR: 'COORDINATOR',
  VOLUNTEER: 'VOLUNTEER',
  OTHER: 'OTHER',
} as const;
export type MembershipType = (typeof MEMBERSHIP_TYPE)[keyof typeof MEMBERSHIP_TYPE];

export const GENDER = { MALE: 'MALE', FEMALE: 'FEMALE', OTHER: 'OTHER' } as const;
export type Gender = (typeof GENDER)[keyof typeof GENDER];

export const COMMUNITY_TARGET_GROUP = {
  PARENTS: 'PARENTS',
  WOMEN: 'WOMEN',
  YOUTH: 'YOUTH',
  GENERAL: 'GENERAL',
} as const;
export type CommunityTargetGroup =
  (typeof COMMUNITY_TARGET_GROUP)[keyof typeof COMMUNITY_TARGET_GROUP];

export const COMMITTEE_LEVEL = {
  DISTRICT: 'DISTRICT',
  UNIT: 'UNIT',
  COMMUNITY: 'COMMUNITY',
} as const;
export type CommitteeLevel = (typeof COMMITTEE_LEVEL)[keyof typeof COMMITTEE_LEVEL];

export const COMMITTEE_POSITION = {
  CHAIRPERSON: 'CHAIRPERSON',
  VICE_CHAIRPERSON: 'VICE_CHAIRPERSON',
  SECRETARY: 'SECRETARY',
  TREASURER: 'TREASURER',
  COORDINATOR: 'COORDINATOR',
  MEMBER: 'MEMBER',
  ADVISOR: 'ADVISOR',
} as const;
export type CommitteePosition = (typeof COMMITTEE_POSITION)[keyof typeof COMMITTEE_POSITION];

export const EVENT_TYPE = {
  MEETING: 'MEETING',
  TRAINING: 'TRAINING',
  AWARENESS_PROGRAM: 'AWARENESS_PROGRAM',
  COMMUNITY_PROGRAM: 'COMMUNITY_PROGRAM',
  SPORTS: 'SPORTS',
  CULTURAL: 'CULTURAL',
  SOCIAL_SERVICE: 'SOCIAL_SERVICE',
  WORKSHOP: 'WORKSHOP',
  OTHER: 'OTHER',
} as const;
export type EventType = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE];

export const EVENT_LEVEL = {
  DISTRICT: 'DISTRICT',
  UNIT: 'UNIT',
  COMMUNITY: 'COMMUNITY',
  COMMITTEE: 'COMMITTEE',
} as const;
export type EventLevel = (typeof EVENT_LEVEL)[keyof typeof EVENT_LEVEL];

export const EVENT_STATUS = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED',
} as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];
