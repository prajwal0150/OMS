/**
 * Granular permissions. Keys are stored on Role and User documents and are
 * checked by `requirePermission()` middleware, therefore they must stay stable.
 */
export const PERMISSIONS = {
  ORGANIZATION_VIEW: 'organization.view',
  ORGANIZATION_UPDATE: 'organization.update',

  DISTRICT_VIEW: 'district.view',
  DISTRICT_UPDATE: 'district.update',

  UNIT_CREATE: 'unit.create',
  UNIT_VIEW: 'unit.view',
  UNIT_UPDATE: 'unit.update',
  UNIT_DELETE: 'unit.delete',

  COMMUNITY_CREATE: 'community.create',
  COMMUNITY_VIEW: 'community.view',
  COMMUNITY_UPDATE: 'community.update',
  COMMUNITY_DELETE: 'community.delete',

  MEMBER_CREATE: 'member.create',
  MEMBER_VIEW: 'member.view',
  MEMBER_UPDATE: 'member.update',
  MEMBER_DELETE: 'member.delete',

  MEMBER_ACCOUNT_CREATE: 'member.account.create',
  MEMBER_ACCOUNT_VIEW: 'member.account.view',
  MEMBER_ACCOUNT_UPDATE: 'member.account.update',
  MEMBER_ACCOUNT_ACTIVATE: 'member.account.activate',
  MEMBER_ACCOUNT_DEACTIVATE: 'member.account.deactivate',
  MEMBER_ACCOUNT_RESET_PASSWORD: 'member.account.resetPassword',

  COMMITTEE_CREATE: 'committee.create',
  COMMITTEE_VIEW: 'committee.view',
  COMMITTEE_UPDATE: 'committee.update',
  COMMITTEE_DELETE: 'committee.delete',

  EVENT_CREATE: 'event.create',
  EVENT_VIEW: 'event.view',
  EVENT_UPDATE: 'event.update',
  EVENT_DELETE: 'event.delete',

  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_UPDATE: 'attendance.update',

  CONTENT_CREATE: 'content.create',
  CONTENT_VIEW: 'content.view',
  CONTENT_UPDATE: 'content.update',
  CONTENT_DELETE: 'content.delete',
  CONTENT_PUBLISH: 'content.publish',
  CONTENT_APPROVE: 'content.approve',

  ANNOUNCEMENT_CREATE: 'announcement.create',
  ANNOUNCEMENT_VIEW: 'announcement.view',
  ANNOUNCEMENT_UPDATE: 'announcement.update',
  ANNOUNCEMENT_DELETE: 'announcement.delete',

  MEDIA_CREATE: 'media.create',
  MEDIA_VIEW: 'media.view',
  MEDIA_DELETE: 'media.delete',

  DOCUMENT_CREATE: 'document.create',
  DOCUMENT_VIEW: 'document.view',
  DOCUMENT_UPDATE: 'document.update',
  DOCUMENT_DELETE: 'document.delete',

  REPORT_VIEW: 'report.view',
  REPORT_EXPORT: 'report.export',

  ADMIN_ACCOUNT_CREATE: 'admin.account.create',
  ADMIN_ACCOUNT_VIEW: 'admin.account.view',
  ADMIN_ACCOUNT_UPDATE: 'admin.account.update',
  ADMIN_ACCOUNT_ACTIVATE: 'admin.account.activate',
  ADMIN_ACCOUNT_DEACTIVATE: 'admin.account.deactivate',
  ADMIN_ACCOUNT_SUSPEND: 'admin.account.suspend',
  ADMIN_ACCOUNT_RESET_PASSWORD: 'admin.account.resetPassword',
  ADMIN_ACCOUNT_ASSIGN_SCOPE: 'admin.account.assignScope',

  USER_MANAGE: 'user.manage',
  ROLE_MANAGE: 'role.manage',
  PERMISSION_MANAGE: 'permission.manage',

  AUDIT_VIEW: 'audit.view',
  SETTINGS_MANAGE: 'settings.manage',

  /** Member portal access, granted to every internal role. */
  PORTAL_ACCESS: 'portal.access',
  /** Self-service updates of permitted personal profile fields. */
  PROFILE_SELF_UPDATE: 'profile.self.update',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[];

export const isValidPermission = (value: string): value is Permission =>
  (ALL_PERMISSIONS as string[]).includes(value);
