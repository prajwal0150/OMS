export const ACCOUNT_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

export const MEMBER_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];

/** Review state of a member registered by a unit/community level account. */
export const REGISTRATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUS)[keyof typeof REGISTRATION_STATUS];

/**
 * How a member takes part in the organization. The district committee roles are
 * declared first because that is the order every admin screen offers them in;
 * the historical values are kept last so records created before them stay valid.
 */
export const MEMBERSHIP_TYPE = {
  DISTRICT_CHIEF: 'DISTRICT_CHIEF',
  SECRETARY: 'SECRETARY',
  JOINT_SECRETARY: 'JOINT_SECRETARY',
  CHAIRPERSON: 'CHAIRPERSON',
  VICE_CHAIRPERSON: 'VICE_CHAIRPERSON',
  TREASURER: 'TREASURER',
  JOINT_TREASURER: 'JOINT_TREASURER',
  REGULAR: 'REGULAR',
  COMMITTEE: 'COMMITTEE',
  COORDINATOR: 'COORDINATOR',
  VOLUNTEER: 'VOLUNTEER',
  OTHER: 'OTHER',
} as const;
export type MembershipType = (typeof MEMBERSHIP_TYPE)[keyof typeof MEMBERSHIP_TYPE];

export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;
export type Gender = (typeof GENDER)[keyof typeof GENDER];

export const RECORD_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type RecordStatus = (typeof RECORD_STATUS)[keyof typeof RECORD_STATUS];

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
export type CommitteePosition =
  (typeof COMMITTEE_POSITION)[keyof typeof COMMITTEE_POSITION];

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
export type AttendanceStatus =
  (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const ORGANIZATION_NAME = 'HEAVENLY PATH SUNSARI DISTRICT';
export const ORGANIZATION_SHORT_NAME = 'HEAVENLY PATH';
export const DEFAULT_DISTRICT_NAME = 'Sunsari';
export const DEFAULT_PROVINCE = 'Koshi Province';
export const DEFAULT_COUNTRY = 'Nepal';
export const MEMBER_ID_PREFIX = 'HPS-SUN';
export const MEMBER_ID_PADDING = 5;

export * from './enumsContent';


/** Lifecycle of a message submitted through the public contact page. */
export const CONTACT_STATUS = {
  NEW: 'NEW',
  READ: 'READ',
  REPLIED: 'REPLIED',
  SPAM: 'SPAM',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ContactStatus = (typeof CONTACT_STATUS)[keyof typeof CONTACT_STATUS];
