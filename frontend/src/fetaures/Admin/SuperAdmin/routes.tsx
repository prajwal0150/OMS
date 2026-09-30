import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../Auth/routeGuards/AuthGuards';
import AdminLayout from '../Layouts/pages/AdminLayout';
import NotificationsPage from '../../Notifications/pages/NotificationsPage';
import { PERMISSIONS, ROLE } from '../../../types';

/**
 * Super Admin route table.
 *
 * These are the *only* `/admin` routes mounted when a super admin signs in, so
 * the district and unit tables are never even evaluated for that user. Each
 * panel owns its routes outright - there is no shared route file that could be
 * widened by accident.
 */
const AdminDashboardPage = lazy(() => import('./Dashboard/pages/DashboardPage'));
const ProfilePage = lazy(() => import('./Profile/pages/ProfilePage'));
const OrganizationPage = lazy(() => import('./Organization/pages/OrganizationPage'));
const DistrictPage = lazy(() => import('./District/pages/DistrictPage'));
const UnitsAdminPage = lazy(() => import('./Units/pages/UnitsPage'));
const CommunitiesAdminPage = lazy(() => import('./Communities/pages/CommunitiesPage'));
const MembersPage = lazy(() => import('./Members/pages/MembersPage'));
const MemberDetailsPage = lazy(() => import('./Members/pages/MemberDetailsPage'));
const AddMemberPage = lazy(() => import('./Members/pages/AddMemberPage'));
const EditMemberPage = lazy(() => import('./Members/pages/EditMemberPage'));
const MemberRequestsPage = lazy(() => import('./Members/pages/MemberRequestsPage'));
const CommitteesPage = lazy(() => import('./Committees/pages/CommitteesPage'));
const EventsAdminPage = lazy(() => import('./Events/pages/EventsPage'));
const AttendancePage = lazy(() => import('./Attendance/pages/AttendancePage'));
const ContentFeedPage = lazy(() => import('./Content/pages/ContentFeedPage'));
const CreateContentPage = lazy(() => import('./Content/pages/CreateContentPage'));
const EditContentPage = lazy(() => import('./Content/pages/EditContentPage'));
const ContentPreviewPage = lazy(() => import('./Content/pages/ContentPreviewPage'));
const ContentReviewPage = lazy(() => import('./Content/pages/ContentReviewPage'));
const AnnouncementsAdminPage = lazy(() => import('./Announcements/pages/AnnouncementsPage'));
const ReportsPage = lazy(() => import('./Reports/pages/ReportsPage'));
const AdministratorsPage = lazy(() => import('./Administrators/pages/AdministratorsPage'));
const RolesPage = lazy(() => import('./Administrators/pages/RolesPage'));
const PermissionsPage = lazy(() => import('./Administrators/pages/PermissionsPage'));
const AuditLogsPage = lazy(() => import('./AuditLogs/pages/AuditLogsPage'));
const ContactMessagesPage = lazy(() => import('./ContactMessages/pages/ContactMessagesPage'));
const SettingsPage = lazy(() => import('./Settings/pages/SettingsPage'));
export const superAdminRoutes = (
  <Route
    path="/admin"
    element={
      <ProtectedRoute roles={[ROLE.SUPER_ADMIN]}>
        <AdminLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<AdminDashboardPage />} />

    <Route
      path="organization"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.ORGANIZATION_VIEW]} roles={[ROLE.SUPER_ADMIN]}>
          <OrganizationPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="district"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.DISTRICT_VIEW]} roles={[ROLE.SUPER_ADMIN]}>
          <DistrictPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="units"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.UNIT_VIEW]}>
          <UnitsAdminPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="communities"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.COMMUNITY_VIEW]}>
          <CommunitiesAdminPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="members"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.MEMBER_VIEW]}>
          <MembersPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="members/new"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.MEMBER_CREATE]}>
          <AddMemberPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="members/requests"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.MEMBER_REGISTER_APPROVE]}>
          <MemberRequestsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="members/:id/edit"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.MEMBER_UPDATE]}>
          <EditMemberPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="members/:id"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.MEMBER_VIEW]}>
          <MemberDetailsPage />
        </ProtectedRoute>
      }
    />
  <Route
      path="committees"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.COMMITTEE_VIEW]}>
          <CommitteesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="events"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.EVENT_VIEW]}>
          <EventsAdminPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="attendance"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.ATTENDANCE_VIEW]}>
          <AttendancePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="announcements"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.ANNOUNCEMENT_VIEW]}>
          <AnnouncementsAdminPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="content"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.CONTENT_VIEW]}>
          <ContentFeedPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="content/new"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.CONTENT_CREATE]}>
          <CreateContentPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="content/review"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.CONTENT_APPROVE]}>
          <ContentReviewPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="content/:id/edit"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.CONTENT_UPDATE]}>
          <EditContentPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="content/:id/preview"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.CONTENT_VIEW]}>
          <ContentPreviewPage />
        </ProtectedRoute>
      }
    />
    {/* Media and documents merged into the content feed; keep old links alive. */}
    <Route path="media" element={<Navigate to="/admin/content" replace />} />
    <Route path="documents" element={<Navigate to="/admin/content" replace />} />
  <Route
      path="reports"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.REPORT_VIEW]}>
          <ReportsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="administrators"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.ADMIN_ACCOUNT_VIEW]}>
          <AdministratorsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="roles"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.ROLE_MANAGE]}>
          <RolesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="permissions"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.PERMISSION_MANAGE]}>
          <PermissionsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="audit-logs"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.AUDIT_VIEW]}>
          <AuditLogsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="settings"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.ADMIN_ACCOUNT_VIEW]}>
          <SettingsPage />
        </ProtectedRoute>
      }
    />
    {/* Self service — every admin panel has its own copy. */}
    <Route path="profile" element={<ProfilePage />} />
    <Route path="notifications" element={<NotificationsPage />} />
    <Route
      path="contact-messages"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.SETTINGS_MANAGE]}>
          <ContactMessagesPage />
        </ProtectedRoute>
      }
    />
  </Route>
);

export default superAdminRoutes;
