import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  History,
  IdCard,
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
} from 'lucide-react';
import { PERMISSIONS } from '../../../../types';
import type { NavSection } from '../../Layouts/config/navigation';

/**
 * Super Admin navigation - the full panel, written out explicitly.
 *
 * A super admin holds every permission, so this list is the superset that the
 * district and unit panels are trimmed from. Adding an entry here makes it
 * appear for super admins only; the other panels keep independent lists.
 */
export const SUPER_ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        label: 'Dashboard',
        to: '/admin',
        icon: LayoutDashboard,
        end: true,
        permissions: [PERMISSIONS.ORGANIZATION_VIEW],
      },
    ],
  },
  {
    heading: 'Organization',
    items: [
      {
        label: 'Organization',
        to: '/admin/organization',
        icon: Building2,
        permissions: [PERMISSIONS.ORGANIZATION_VIEW],
      },
      { label: 'District', to: '/admin/district', icon: Map, permissions: [PERMISSIONS.DISTRICT_VIEW] },
      { label: 'Units', to: '/admin/units', icon: Network, permissions: [PERMISSIONS.UNIT_VIEW] },
      {
        label: 'Communities',
        to: '/admin/communities',
        icon: UsersRound,
        permissions: [PERMISSIONS.COMMUNITY_VIEW],
      },
    ],
  },
  {
    heading: 'People',
    items: [
      { label: 'Members', to: '/admin/members', icon: IdCard, permissions: [PERMISSIONS.MEMBER_VIEW] },
      {
        label: 'Registration Requests',
        to: '/admin/members/requests',
        icon: ClipboardList,
        permissions: [PERMISSIONS.MEMBER_REGISTER_APPROVE],
      },
      {
        label: 'Committees',
        to: '/admin/committees',
        icon: ShieldCheck,
        permissions: [PERMISSIONS.COMMITTEE_VIEW],
      },
      {
        label: 'Administrators',
        to: '/admin/administrators',
        icon: UserCog,
        permissions: [PERMISSIONS.ADMIN_ACCOUNT_VIEW],
      },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Events', to: '/admin/events', icon: CalendarDays, permissions: [PERMISSIONS.EVENT_VIEW] },
      {
        label: 'Attendance',
        to: '/admin/attendance',
        icon: ClipboardCheck,
        permissions: [PERMISSIONS.ATTENDANCE_VIEW],
      },
      {
        label: 'Announcements',
        to: '/admin/announcements',
        icon: Megaphone,
        permissions: [PERMISSIONS.ANNOUNCEMENT_VIEW],
      },
    ],
  },
  {
    heading: 'Content',
    items: [
      // Media and documents attach straight onto a post, so the whole section is
      // one feed instead of three separate libraries.
      { label: 'Content', to: '/admin/content', icon: FileText, permissions: [PERMISSIONS.CONTENT_VIEW] },
      {
        label: 'Review queue',
        to: '/admin/content/review',
        icon: ClipboardCheck,
        permissions: [PERMISSIONS.CONTENT_APPROVE],
      },
    ],
  },
  {
    heading: 'Insight',
    items: [{ label: 'Reports', to: '/admin/reports', icon: BarChart3, permissions: [PERMISSIONS.REPORT_VIEW] }],
  },
  {
    heading: 'System',
    items: [
      // `role.manage` and `permission.manage` are super-admin only, so these
      // entries are unreachable from the district and unit panels.
      { label: 'Roles', to: '/admin/roles', icon: KeyRound, permissions: [PERMISSIONS.ROLE_MANAGE] },
      {
        label: 'Permissions',
        to: '/admin/permissions',
        icon: Shield,
        permissions: [PERMISSIONS.PERMISSION_MANAGE],
      },
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

export default SUPER_ADMIN_NAV_SECTIONS;