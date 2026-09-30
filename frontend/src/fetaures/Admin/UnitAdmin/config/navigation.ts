import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  IdCard,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { PERMISSIONS } from '../../../../types';
import type { NavSection } from '../../Layouts/config/navigation';

/**
 * Unit Admin navigation.
 *
 * A unit admin is scoped to one unit. Units, Organization, District,
 * Administrators, Roles and Permissions are deliberately absent - a unit
 * admin has no `unit.manage` or `admin.account.*` permission, so those pages
 * could never load anyway.
 */
export const UNIT_ADMIN_NAV_SECTIONS: NavSection[] = [
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
];

export default UNIT_ADMIN_NAV_SECTIONS;