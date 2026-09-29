import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  FolderOpen,
  History,
  IdCard,
  Image,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Map,
  Megaphone,
  Network,
  Settings,
  Shield,
  ShieldCheck,
  UserCog,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { PERMISSIONS } from '../../../../types';

/**
 * Centralized navigation authorization.
 * Visibility is derived from role + permission only - never from the route.
 * The backend independently enforces permissions and organizational scope.
 */
export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Any one of these permissions grants access. */
  permissions?: string[];
  /** Every one of these permissions is required. */
  allPermissions?: string[];
  /** Restricts the item to specific roles. */
  roles?: string[];
  end?: boolean;
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true, permissions: [PERMISSIONS.ORGANIZATION_VIEW] },
    ],
  },
  {
    heading: 'Organization',
    items: [
      { label: 'Organization', to: '/admin/organization', icon: Building2, permissions: [PERMISSIONS.ORGANIZATION_VIEW] },
      { label: 'District', to: '/admin/district', icon: Map, permissions: [PERMISSIONS.DISTRICT_VIEW] },
      { label: 'Units', to: '/admin/units', icon: Network, permissions: [PERMISSIONS.UNIT_VIEW] },
      { label: 'Communities', to: '/admin/communities', icon: UsersRound, permissions: [PERMISSIONS.COMMUNITY_VIEW] },
    ],
  },
  {
    heading: 'People',
    items: [
      { label: 'Members', to: '/admin/members', icon: IdCard, permissions: [PERMISSIONS.MEMBER_VIEW] },
      { label: 'Committees', to: '/admin/committees', icon: ShieldCheck, permissions: [PERMISSIONS.COMMITTEE_VIEW] },
      { label: 'Administrators', to: '/admin/administrators', icon: UserCog, permissions: [PERMISSIONS.ADMIN_ACCOUNT_VIEW] },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Events', to: '/admin/events', icon: CalendarDays, permissions: [PERMISSIONS.EVENT_VIEW] },
      { label: 'Attendance', to: '/admin/attendance', icon: ClipboardCheck, permissions: [PERMISSIONS.ATTENDANCE_VIEW] },
      { label: 'Announcements', to: '/admin/announcements', icon: Megaphone, permissions: [PERMISSIONS.ANNOUNCEMENT_VIEW] },
    ],
  },
  {
    heading: 'Content',
    items: [
      { label: 'Content', to: '/admin/content', icon: FileText, permissions: [PERMISSIONS.CONTENT_VIEW] },
      { label: 'Media Library', to: '/admin/media', icon: Image, permissions: [PERMISSIONS.MEDIA_VIEW] },
      { label: 'Documents', to: '/admin/documents', icon: FolderOpen, permissions: [PERMISSIONS.DOCUMENT_VIEW] },
    ],
  },
  {
    heading: 'Insight',
    items: [
      { label: 'Reports', to: '/admin/reports', icon: BarChart3, permissions: [PERMISSIONS.REPORT_VIEW] },
    ],
  },
  {
    heading: 'System',
    items: [
      { label: 'Roles', to: '/admin/roles', icon: KeyRound, permissions: [PERMISSIONS.ROLE_MANAGE, PERMISSIONS.ADMIN_ACCOUNT_VIEW] },
      { label: 'Permissions', to: '/admin/permissions', icon: Shield, permissions: [PERMISSIONS.PERMISSION_MANAGE] },
      { label: 'Audit Logs', to: '/admin/audit-logs', icon: History, permissions: [PERMISSIONS.AUDIT_VIEW] },
    {
      label: 'Contact Messages',
      to: '/admin/contact-messages',
      icon: Inbox,
      permissions: [PERMISSIONS.SETTINGS_MANAGE],
    },
      { label: 'Settings', to: '/admin/settings', icon: Settings, permissions: [PERMISSIONS.SETTINGS_MANAGE] },
    ],
  },
];

export interface NavVisibilityContext {
  permissions: string[];
  role: string | null;
}

/** True when the signed-in account may see (and open) a navigation item. */
export const canSeeNavItem = (item: NavItem, context: NavVisibilityContext): boolean => {
  if (item.roles && context.role && !item.roles.includes(context.role)) return false;
  if (item.permissions && item.permissions.length > 0) {
    return item.permissions.some((permission) => context.permissions.includes(permission));
  }
  if (item.allPermissions && item.allPermissions.length > 0) {
    return item.allPermissions.every((permission) => context.permissions.includes(permission));
  }
  return true;
};

/** Filters the navigation tree for the signed-in account. */
export const visibleNavSections = (context: NavVisibilityContext): NavSection[] =>
  NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canSeeNavItem(item, context)),
  })).filter((section) => section.items.length > 0);

/** Flat list of everything visible - used for the mobile drawer and search. */
export const visibleNavItems = (context: NavVisibilityContext): NavItem[] =>
  visibleNavSections(context).flatMap((section) => section.items);
