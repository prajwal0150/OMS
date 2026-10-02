import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LoadingState } from '../components/ui';
import {
  ProtectedRoute,
  PublicOnlyRoute,
  ForbiddenPage,
} from '../fetaures/Auth/routeGuards/AuthGuards';
import { useAuthState } from '../fetaures/Auth/hooks/useAuth';
import ChangePasswordPage from '../fetaures/Auth/ChangePassword/pages/ChangePasswordPage';
import LoginPage from '../fetaures/Auth/Login/pages/LoginPage';
import ForgotPasswordPage from '../fetaures/Auth/ForgotPassword/pages/ForgotPasswordPage';
import ResetPasswordPage from '../fetaures/Auth/ResetPassword/pages/ResetPasswordPage';
import PublicLayout from '../fetaures/Public/Layouts/PublicLayout';
import MemberLayout from '../fetaures/Members/Layouts/MemberLayout';
import NotificationsPage from '../fetaures/Notifications/pages/NotificationsPage';

/*
 * Each admin panel owns its own `/admin` route table. Only the signed-in role's
 * table is mounted, so a district admin's router never contains the super-admin
 * pages at all - the separation is structural, not a permission check.
 */
import { superAdminRoutes } from '../fetaures/Admin/SuperAdmin/routes';
import { districtAdminRoutes } from '../fetaures/Admin/DistrictAdmin/routes';
import { unitAdminRoutes } from '../fetaures/Admin/UnitAdmin/routes';

import { ROLE } from '../types';

/* Route level code splitting keeps the first paint small. */
const HomePage = lazy(() => import('../fetaures/Public/Homepage/pages/HomePage'));
const AboutPage = lazy(() => import('../fetaures/Public/AboutUs/pages/AboutPage'));
const DistrictPage = lazy(() => import('../fetaures/Public/District/pages/DistrictPage'));
const PublicStructurePage = lazy(
  () => import('../fetaures/Public/Structure/pages/StructurePage'),
);
const PublicAnnouncementsPage = lazy(
  () => import('../fetaures/Public/Announcements/pages/AnnouncementsPage'),
);
const PublicActivitiesPage = lazy(
  () => import('../fetaures/Public/Activities/pages/ActivitiesPage'),
);
const ContentDetailsPage = lazy(() => import('../fetaures/Public/Content/pages/ContentDetailsPage'));
const GalleryPage = lazy(() => import('../fetaures/Public/Gallery/pages/GalleryPage'));
const ContactPage = lazy(() => import('../fetaures/Public/ContactUs/pages/ContactPage'));
const NotFoundPage = lazy(() => import('../fetaures/Public/NotFound/pages/NotFoundPage'));

const MemberDashboardPage = lazy(() => import('../fetaures/Members/Dashboard/pages/DashboardPage'));
const MemberProfilePage = lazy(() => import('../fetaures/Members/Profile/pages/ProfilePage'));
const MyCommunitiesPage = lazy(() => import('../fetaures/Members/MyCommunities/pages/MyCommunitiesPage'));
const MyCommitteesPage = lazy(() => import('../fetaures/Members/MyCommittees/pages/MyCommitteesPage'));
const MyEventsPage = lazy(() => import('../fetaures/Members/MyEvents/pages/MyEventsPage'));
const MyAttendancePage = lazy(() => import('../fetaures/Members/MyAttendance/pages/MyAttendancePage'));
const MemberContentPage = lazy(() => import('../fetaures/Members/Content/pages/ContentPage'));
const MemberAnnouncementsPage = lazy(
  () => import('../fetaures/Members/Announcament/pages/AnnouncementsPage'),
);
const MemberDocumentsPage = lazy(() => import('../fetaures/Members/Documents/pages/DocumentsPage'));

const Fallback = <LoadingState label="Loading page..." />;

/**
 * `/events` + `/content` and `/units` + `/communities` were each merged into a
 * single page. Old links (bookmarks, the homepage, notification emails) still
 * point at the old paths, so they redirect. The query string is carried across,
 * otherwise the global header search would silently lose its term on the way
 * through.
 */
function Redirect({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate to={{ pathname: to, search }} replace />;
}

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
    <Route path="structure" element={<PublicStructurePage />} />
    <Route path="units" element={<Redirect to="/structure" />} />
    <Route path="communities" element={<Redirect to="/structure" />} />
    <Route path="activities" element={<PublicActivitiesPage />} />
    <Route path="events" element={<Redirect to="/activities" />} />
    <Route path="content" element={<Redirect to="/activities" />} />
    <Route path="announcements" element={<PublicAnnouncementsPage />} />
    {/* Article detail pages keep their own path: the member portal, the
        homepage panels and backend notification links all deep-link here. */}
    <Route path="content/:slug" element={<ContentDetailsPage />} />
    {/* Gallery is no longer in the header, but the route stays so existing
        bookmarks keep working. */}
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

/** The admin panel the signed-in role belongs to, or null for non-admins. */
function adminRoutesForRole(role: string | null) {
  if (role === ROLE.SUPER_ADMIN) return superAdminRoutes;
  if (role === ROLE.DISTRICT_ADMIN) return districtAdminRoutes;
  if (role === ROLE.UNIT_ADMIN) return unitAdminRoutes;
  return null;
}

/* --------------------------- Member portal ------------------------ */
const memberRoutes = (
  <Route
    path="/portal"
    element={
      <ProtectedRoute memberAllowed membersOnly>
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
  const { mustChangePassword, role } = useAuthState();
  const adminRoutes = adminRoutesForRole(role);

  // Administrators sign in with their default credentials and may change the
  // password any time from their profile menu, so the blocking first sign-in
  // prompt only applies to member accounts.
  const showPasswordPrompt = mustChangePassword && role === ROLE.MEMBER;

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
      {showPasswordPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
            <ChangePasswordPage forced />
          </div>
        </div>
      ) : null}
    </Suspense>
  );
}

export default AppRoutes;