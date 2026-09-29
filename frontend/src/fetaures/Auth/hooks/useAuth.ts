import { useMemo } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useAuth } from '../redux/AuthProvider';
import { selectDisplayName, selectInitials, selectPermissions } from '../redux/authSelector';

/** Consolidated auth hook for pages and layouts. */
export function useAuthState() {
  const context = useAuth();
  const displayName = useAppSelector(selectDisplayName);
  const initials = useAppSelector(selectInitials);
  const permissions = useAppSelector(selectPermissions);

  return useMemo(
    () => ({ ...context, displayName, initials, permissions }),
    [context, displayName, initials, permissions],
  );
}

export { useAuth };
export default useAuthState;
