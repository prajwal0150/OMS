import type { AccountStatus, RoleName } from '../../../../../types/enums';

/** The organizational scope an administrator account is pinned to (read only). */
export interface AdminProfileScope {
  district: string | null;
  unit: string | null;
  community: string | null;
  committee: string | null;
}

/**
 * The signed-in administrator's own account, served by `GET /administrators/me`.
 *
 * This is deliberately a separate shape from the administrator list rows: it is
 * self service, so it carries the caller's own identity and nothing else.
 */
export interface AdminProfile {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhoto: string;
  note: string;
  role: RoleName;
  roleLabel: string;
  status: AccountStatus;
  lastLogin: string | null;
  createdAt: string;
  scope: AdminProfileScope;
}

/** Only these fields are writable; email, role, status and scope are not. */
export type EditableAdminProfile = Pick<
  AdminProfile,
  'firstName' | 'middleName' | 'lastName' | 'phone' | 'profilePhoto' | 'note'
>;