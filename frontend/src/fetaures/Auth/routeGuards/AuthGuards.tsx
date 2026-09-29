import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from '../hooks/useAuth';
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
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, permissions: granted, role } = useAuthState();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

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
