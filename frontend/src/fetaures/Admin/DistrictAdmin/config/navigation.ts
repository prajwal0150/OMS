import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  IdCard,
  LayoutDashboard,
  Megaphone,
  Network,
  ShieldCheck,
  UserCog,
  UsersRound,
} from 'lucide-react';
import { PERMISSIONS } from '../../../../types';
import type { NavSection } from '../../Layouts/config/navigation';

/**
 * District Admin navigation.
 *
 * A district admin works inside an already-assigned district, so there is no
 * Organization, District, Units-creation, Role or Permission entry here. Those
 * items live in `Admin/SuperAdmin/config/navigation.ts` and cannot leak in.
 */
export const DISTRICT_ADMIN_NAV_SECTIONS: NavSection[] = [
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
];

export default DISTRICT_ADMIN_NAV_SECTIONS;