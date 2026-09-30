import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../../store/hooks';
import { useAuthState } from '../hooks/useAuth';
import { selectIsAdministrator } from '../redux/authSelector';
import { Spinner, ErrorState } from '../../../components/ui';

/**
 * Frontend route guards. These are a UX convenience only - the Express
 * middleware always re-checks authentication, permissions and scope.
 */

export interface ProtectedRouteProps {
  children: ReactNode;
  /** When set, the account must hold at least one of these permissions. */
  permissions?: string[];
  /** When set, the account must hold every one of these permissions. */
  allPermissions?: string[];
  /** Restricts the route to these roles. */
  roles?: string[];
  /** Sends members to the member portal and administrators to /admin. */
  memberAllowed?: boolean;
  adminAllowed?: boolean;
  /**
   * Member portal only. Administrators are redirected to `/admin`, because the
   * portal is built on the Member record while an administrator session owns an
   * account. `isAdministrator` is used rather than the role, so committee member
   * and coordinator accounts (which are not administrators) keep portal access.
   */
  membersOnly?: boolean;
}

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Spinner />
        Loading your workspace⬦
      </div>
    </div>
  );
}

export function ProtectedRoute({
  children,
  permissions,
  allPermissions,
  roles,
  memberAllowed = false,
  adminAllowed = true,
  membersOnly = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, permissions: granted, role } = useAuthState();
  const isAdministrator = useAppSelector(selectIsAdministrator);
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  // An admin panel session must never fall through to the member portal.
  if (membersOnly && isAdministrator) return <Navigate to="/admin" replace />;

  if (!memberAllowed && role === 'MEMBER') return <Navigate to="/portal" replace />;
  if (!adminAllowed && role !== 'MEMBER' && role !== 'SUPER_ADMIN') return <Navigate to="/admin" replace />;

  if (roles && role && !roles.includes(role)) {
    return <Navigate to={role === 'MEMBER' ? '/portal' : '/admin'} replace />;
  }
  if (permissions && !permissions.some((item) => granted.includes(item))) {
    return <Navigate to="/forbidden" replace />;
  }
  if (allPermissions && !allPermissions.every((item) => granted.includes(item))) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}

/** Only signed-out visitors reach the public auth pages. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, role } = useAuthState();
  if (loading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to={role === 'MEMBER' ? '/portal' : '/admin'} replace />;
  return <>{children}</>;
}

export function ForbiddenPage() {
  const { role } = useAuthState();
  return (
    <div className="mx-auto max-w-lg p-6">
      <ErrorState
        title="Access denied"
        message="Your account does not have permission to open this page. Contact a Super Admin if you believe this is a mistake."
      />
      <p className="mt-3 text-center text-xs text-muted">
        Signed in as <span className="font-medium">{role ?? 'unknown'}</span>
      </p>
    </div>
  );
}

export default ProtectedRoute;
