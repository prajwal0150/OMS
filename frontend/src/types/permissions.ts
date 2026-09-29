/**
 * Granular permission keys. Mirrors `backend/src/constants/permissions.ts`;
 * these strings are stored on Role and User documents.
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
  PORTAL_ACCESS: 'portal.access',
  PROFILE_SELF_UPDATE: 'profile.self.update',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Module grouping used by the roles / permissions administration screens. */
export const PERMISSION_GROUPS: Array<{
  module: string;
  description?: string;
  permissions: Permission[];
}> = [
  {
    module: 'Organization',
    permissions: [PERMISSIONS.ORGANIZATION_VIEW, PERMISSIONS.ORGANIZATION_UPDATE],
  },
  { module: 'District', permissions: [PERMISSIONS.DISTRICT_VIEW, PERMISSIONS.DISTRICT_UPDATE] },
  {
    module: 'Units',
    permissions: [
      PERMISSIONS.UNIT_CREATE,
      PERMISSIONS.UNIT_VIEW,
      PERMISSIONS.UNIT_UPDATE,
      PERMISSIONS.UNIT_DELETE,
    ],
  },
  {
    module: 'Communities',
    permissions: [
      PERMISSIONS.COMMUNITY_CREATE,
      PERMISSIONS.COMMUNITY_VIEW,
      PERMISSIONS.COMMUNITY_UPDATE,
      PERMISSIONS.COMMUNITY_DELETE,
    ],
  },
  {
    module: 'Members',
    permissions: [
      PERMISSIONS.MEMBER_CREATE,
      PERMISSIONS.MEMBER_VIEW,
      PERMISSIONS.MEMBER_UPDATE,
      PERMISSIONS.MEMBER_DELETE,
    ],
  },
  {
    module: 'Member Accounts',
    permissions: [
      PERMISSIONS.MEMBER_ACCOUNT_CREATE,
      PERMISSIONS.MEMBER_ACCOUNT_VIEW,
      PERMISSIONS.MEMBER_ACCOUNT_UPDATE,
      PERMISSIONS.MEMBER_ACCOUNT_ACTIVATE,
      PERMISSIONS.MEMBER_ACCOUNT_DEACTIVATE,
      PERMISSIONS.MEMBER_ACCOUNT_RESET_PASSWORD,
    ],
  },
  {
    module: 'Committees',
    permissions: [
      PERMISSIONS.COMMITTEE_CREATE,
      PERMISSIONS.COMMITTEE_VIEW,
      PERMISSIONS.COMMITTEE_UPDATE,
      PERMISSIONS.COMMITTEE_DELETE,
    ],
  },
  {
    module: 'Events',
    permissions: [
      PERMISSIONS.EVENT_CREATE,
      PERMISSIONS.EVENT_VIEW,
      PERMISSIONS.EVENT_UPDATE,
      PERMISSIONS.EVENT_DELETE,
    ],
  },
  {
    module: 'Attendance',
    permissions: [
      PERMISSIONS.ATTENDANCE_CREATE,
      PERMISSIONS.ATTENDANCE_VIEW,
      PERMISSIONS.ATTENDANCE_UPDATE,
    ],
  },
  {
    module: 'Content',
    permissions: [
      PERMISSIONS.CONTENT_CREATE,
      PERMISSIONS.CONTENT_VIEW,
      PERMISSIONS.CONTENT_UPDATE,
      PERMISSIONS.CONTENT_DELETE,
      PERMISSIONS.CONTENT_PUBLISH,
      PERMISSIONS.CONTENT_APPROVE,
    ],
  },
  {
    module: 'Announcements',
    permissions: [
      PERMISSIONS.ANNOUNCEMENT_CREATE,
      PERMISSIONS.ANNOUNCEMENT_VIEW,
      PERMISSIONS.ANNOUNCEMENT_UPDATE,
      PERMISSIONS.ANNOUNCEMENT_DELETE,
    ],
  },
  {
    module: 'Media',
    permissions: [PERMISSIONS.MEDIA_CREATE, PERMISSIONS.MEDIA_VIEW, PERMISSIONS.MEDIA_DELETE],
  },
  {
    module: 'Documents',
    permissions: [
      PERMISSIONS.DOCUMENT_CREATE,
      PERMISSIONS.DOCUMENT_VIEW,
      PERMISSIONS.DOCUMENT_UPDATE,
      PERMISSIONS.DOCUMENT_DELETE,
    ],
  },
  {
    module: 'Reports',
    permissions: [PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_EXPORT],
  },
  {
    module: 'Administrators',
    permissions: [
      PERMISSIONS.ADMIN_ACCOUNT_CREATE,
      PERMISSIONS.ADMIN_ACCOUNT_VIEW,
      PERMISSIONS.ADMIN_ACCOUNT_UPDATE,
      PERMISSIONS.ADMIN_ACCOUNT_ACTIVATE,
      PERMISSIONS.ADMIN_ACCOUNT_DEACTIVATE,
      PERMISSIONS.ADMIN_ACCOUNT_SUSPEND,
      PERMISSIONS.ADMIN_ACCOUNT_RESET_PASSWORD,
      PERMISSIONS.ADMIN_ACCOUNT_ASSIGN_SCOPE,
    ],
  },
  {
    module: 'System',
    permissions: [
      PERMISSIONS.USER_MANAGE,
      PERMISSIONS.ROLE_MANAGE,
      PERMISSIONS.PERMISSION_MANAGE,
      PERMISSIONS.AUDIT_VIEW,
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.PORTAL_ACCESS,
      PERMISSIONS.PROFILE_SELF_UPDATE,
    ],
  },
];

