import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingState } from '../components/ui';
import { ProtectedRoute, PublicOnlyRoute, ForbiddenPage } from '../fetaures/Auth/routeGuards/AuthGuards';
import { useAuthState } from '../fetaures/Auth/hooks/useAuth';
import ChangePasswordPage from '../fetaures/Auth/ChangePassword/pages/ChangePasswordPage';
import LoginPage from '../fetaures/Auth/Login/pages/LoginPage';
import ForgotPasswordPage from '../fetaures/Auth/ForgotPassword/pages/ForgotPasswordPage';
import ResetPasswordPage from '../fetaures/Auth/ResetPassword/pages/ResetPasswordPage';
import PublicLayout from '../fetaures/Public/Layouts/PublicLayout';
import MemberLayout from '../fetaures/Members/Layouts/MemberLayout';
import AdminLayout from '../fetaures/Admin/Layouts/pages/AdminLayout';
import { PERMISSIONS } from '../types';

/* Route level code splitting keeps the first paint small. */
const HomePage = lazy(() => import('../fetaures/Public/Homepage/pages/HomePage'));
const AboutPage = lazy(() => import('../fetaures/Public/AboutUs/pages/AboutPage'));
const DistrictPage = lazy(() => import('../fetaures/Public/District/pages/DistrictPage'));
const PublicUnitsPage = lazy(() => import('../fetaures/Public/Units/pages/UnitsPage'));
const PublicCommunitiesPage = lazy(() => import('../fetaures/Public/Communities/pages/CommunitiesPage'));
const PublicEventsPage = lazy(() => import('../fetaures/Public/Event/pages/EventsPage'));
const PublicAnnouncementsPage = lazy(() => import('../fetaures/Public/Announcements/pages/AnnouncementsPage'));
const PublicContentPage = lazy(() => import('../fetaures/Public/Content/pages/ContentListPage'));
const ContentDetailsPage = lazy(() => import('../fetaures/Public/Content/pages/ContentDetailsPage'));
const GalleryPage = lazy(() => import('../fetaures/Public/Gallery/pages/GalleryPage'));
const ContactPage = lazy(() => import('../fetaures/Public/ContactUs/pages/ContactPage'));
const NotFoundPage = lazy(() => import('../fetaures/Public/NotFound/pages/NotFoundPage'));

const AdminDashboardPage = lazy(() => import('../fetaures/Admin/Dashboard/pages/DashboardPage'));
const OrganizationPage = lazy(() => import('../fetaures/Admin/Organization/pages/OrganizationPage'));
const DistrictAdminPage = lazy(() => import('../fetaures/Admin/District/pages/DistrictPage'));
const UnitsAdminPage = lazy(() => import('../fetaures/Admin/Units/pages/UnitsPage'));
const CommunitiesAdminPage = lazy(() => import('../fetaures/Admin/Communities/pages/CommunitiesPage'));
const MembersPage = lazy(() => import('../fetaures/Admin/Members/pages/MembersPage'));
const MemberDetailsPage = lazy(() => import('../fetaures/Admin/Members/pages/MemberDetailsPage'));
const AddMemberPage = lazy(() => import('../fetaures/Admin/Members/pages/AddMemberPage'));
const EditMemberPage = lazy(() => import('../fetaures/Admin/Members/pages/EditMemberPage'));
const CommitteesPage = lazy(() => import('../fetaures/Admin/Committees/pages/CommitteesPage'));
const EventsAdminPage = lazy(() => import('../fetaures/Admin/Events/pages/EventsPage'));
const AttendancePage = lazy(() => import('../fetaures/Admin/Attendance/pages/AttendancePage'));
const ContentAdminPage = lazy(() => import('../fetaures/Admin/Content/pages/ContentListPage'));
const CreateContentPage = lazy(() => import('../fetaures/Admin/Content/pages/CreateContentPage'));
const EditContentPage = lazy(() => import('../fetaures/Admin/Content/pages/EditContentPage'));
const ContentPreviewPage = lazy(() => import('../fetaures/Admin/Content/pages/ContentPreviewPage'));
const ContentReviewPage = lazy(() => import('../fetaures/Admin/Content/pages/ContentReviewPage'));
const AnnouncementsAdminPage = lazy(() => import('../fetaures/Admin/Announcements/pages/AnnouncementsPage'));
const MediaPage = lazy(() => import('../fetaures/Admin/Media/pages/MediaPage'));
const DocumentsPage = lazy(() => import('../fetaures/Admin/Documents/pages/DocumentsPage'));
const ReportsPage = lazy(() => import('../fetaures/Admin/Reports/pages/ReportsPage'));
const AdministratorsPage = lazy(() => import('../fetaures/Admin/Administrators/pages/AdministratorsPage'));
const RolesPage = lazy(() => import('../fetaures/Admin/Administrators/pages/RolesPage'));
const PermissionsPage = lazy(() => import('../fetaures/Admin/Administrators/pages/PermissionsPage'));
const AuditLogsPage = lazy(() => import('../fetaures/Admin/AuditLogs/pages/AuditLogsPage'));
const ContactMessagesPage =
  lazy(() => import('../fetaures/Admin/ContactMessages/pages/ContactMessagesPage'));
const SettingsPage = lazy(() => import('../fetaures/Admin/Settings/pages/SettingsPage'));
const NotificationsPage = lazy(() => import('../fetaures/Notifications/pages/NotificationsPage'));

const MemberDashboardPage = lazy(() => import('../fetaures/Members/Dashboard/pages/DashboardPage'));
const MemberProfilePage = lazy(() => import('../fetaures/Members/Profile/pages/ProfilePage'));
const MyCommunitiesPage = lazy(() => import('../fetaures/Members/MyCommunities/pages/MyCommunitiesPage'));
const MyCommitteesPage = lazy(() => import('../fetaures/Members/MyCommittees/pages/MyCommitteesPage'));
const MyEventsPage = lazy(() => import('../fetaures/Members/MyEvents/pages/MyEventsPage'));
const MyAttendancePage = lazy(() => import('../fetaures/Members/MyAttendance/pages/MyAttendancePage'));
const MemberContentPage = lazy(() => import('../fetaures/Members/Content/pages/ContentPage'));
const MemberAnnouncementsPage = lazy(() => import('../fetaures/Members/Announcament/pages/AnnouncementsPage'));
const MemberDocumentsPage = lazy(() => import('../fetaures/Members/Documents/pages/DocumentsPage'));

const Fallback = <LoadingState label="Loading page..." />;

/* ------------------------------------------------------------------ *
 * Public website - no authentication required.
 * There is deliberately no /register route: accounts are provisioned by
 * the Super Admin (administrators) or by district/unit admins (members).
 * ------------------------------------------------------------------ */
const publicRoutes = (
  <Route element={<PublicLayout />}>
    <Route index element={<HomePage />} />
    <Route path="about" element={<AboutPage />} />
    <Route path="district" element={<DistrictPage />} />
    <Route path="units" element={<PublicUnitsPage />} />
    <Route path="communities" element={<PublicCommunitiesPage />} />
    <Route path="events" element={<PublicEventsPage />} />
    <Route path="announcements" element={<PublicAnnouncementsPage />} />
    <Route path="content" element={<PublicContentPage />} />
    <Route path="content/:slug" element={<ContentDetailsPage />} />
    <Route path="gallery" element={<GalleryPage />} />
    <Route path="contact" element={<ContactPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Route>
);

/* ----------------------------- Auth ------------------------------- */
const authRoutes = (
  <>
    <Route
      path="/login"
      element={
        <PublicOnlyRoute>
          <LoginPage />
        </PublicOnlyRoute>
      }
    />
    <Route
      path="/forgot-password"
      element={
        <PublicOnlyRoute>
          <ForgotPasswordPage />
        </PublicOnlyRoute>
      }
    />
    <Route
      path="/reset-password/:token"
      element={
        <PublicOnlyRoute>
          <ResetPasswordPage />
        </PublicOnlyRoute>
      }
    />
    <Route
      path="/change-password"
      element={
        <ProtectedRoute memberAllowed adminAllowed>
          <ChangePasswordPage />
        </ProtectedRoute>
      }
    />
  </>
);

/* ---------------------------- Admin area -------------------------- */
const adminRoutes = (
  <Route
    path="/admin"
    element={
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<AdminDashboardPage />} />

    <Route
      path="organization"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.ORGANIZATION_VIEW]}>
          <OrganizationPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="district"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.DISTRICT_VIEW]}>
          <DistrictAdminPage />
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
          <ContentAdminPage />
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
    <Route
      path="media"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.MEDIA_VIEW]}>
          <MediaPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="documents"
      element={
        <ProtectedRoute permissions={[PERMISSIONS.DOCUMENT_VIEW]}>
          <DocumentsPage />
        </ProtectedRoute>
      }
    />
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
        <ProtectedRoute permissions={[PERMISSIONS.ROLE_MANAGE, PERMISSIONS.ADMIN_ACCOUNT_VIEW]}>
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

/* --------------------------- Member portal ------------------------ */
const memberRoutes = (
  <Route
    path="/portal"
    element={
      <ProtectedRoute memberAllowed>
        <MemberLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<MemberDashboardPage />} />
    <Route path="profile" element={<MemberProfilePage />} />
    <Route path="communities" element={<MyCommunitiesPage />} />
    <Route path="committees" element={<MyCommitteesPage />} />
    <Route path="events" element={<MyEventsPage />} />
    <Route path="attendance" element={<MyAttendancePage />} />
    <Route path="content" element={<MemberContentPage />} />
    <Route path="announcements" element={<MemberAnnouncementsPage />} />
    <Route path="documents" element={<MemberDocumentsPage />} />
    <Route path="notifications" element={<NotificationsPage />} />
  </Route>
);

/**
 * Root route table. Guards are a UX convenience only: the Express middleware
 * re-checks authentication, permissions and organizational scope on every call.
 */
export function AppRoutes() {
  const { mustChangePassword } = useAuthState();

  return (
    <Suspense fallback={Fallback}>
      <Routes>
        {publicRoutes}
        {authRoutes}
        {adminRoutes}
        {memberRoutes}
        <Route
          path="/forbidden"
          element={
            <ProtectedRoute>
              <ForbiddenPage />
            </ProtectedRoute>
          }
        />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
      </Routes>
      {mustChangePassword ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
            <ChangePasswordPage />
          </div>
        </div>
      ) : null}
    </Suspense>
  );
}

export default AppRoutes;
