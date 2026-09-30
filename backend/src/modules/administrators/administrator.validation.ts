import { z } from 'zod';
import { ACCOUNT_STATUS } from '../../constants/enums';
import { ADMIN_MANAGED_ROLES } from '../../constants/rolePermissions';
import type { RoleName } from '../../constants/roles';
import { PASSWORD_POLICY_MESSAGE, isStrongPassword } from '../../utils/password';
import {
  emailSchema,
  optionalObjectId,
  optionalString,
  paginationSchema,
  phoneSchema,
  requiredString,
} from '../../shared/validation';

const adminRoleSchema = z.enum(
  ADMIN_MANAGED_ROLES as unknown as [RoleName, ...RoleName[]],
  { errorMap: () => ({ message: 'Choose a valid administrator role' }) },
);

const optionalPassword = z
  .string()
  .optional()
  .refine((value) => !value || isStrongPassword(value), { message: PASSWORD_POLICY_MESSAGE });

export const createAdministratorSchema = z.object({
  firstName: requiredString(1, 60),
  middleName: optionalString(60),
  lastName: requiredString(1, 60),
  email: emailSchema,
  phone: phoneSchema,
  role: adminRoleSchema,
  password: optionalPassword,
  district: optionalObjectId,
  unit: optionalObjectId,
  community: optionalObjectId,
  committee: optionalObjectId,
  note: optionalString(500),
});

export const updateAdministratorSchema = createAdministratorSchema.partial().extend({
  email: emailSchema.optional(),
});

/**
 * Administrators may only maintain their own contact details.
 *
 * `email` is deliberately absent: it is the login identity, and the
 * authenticated `AuthUser.email` is issued into the access token, so a silent
 * self-service change would leave the session inconsistent. `role`, `status`
 * and the organizational scope are administrator-controlled.
 */
export const updateOwnAdministratorProfileSchema = z.object({
  firstName: requiredString(1, 60),
  middleName: optionalString(60),
  lastName: requiredString(1, 60),
  phone: phoneSchema,
  profilePhoto: optionalString(400),
  note: optionalString(500),
});

export const administratorStatusSchema = z.object({
  status: z.enum(
    [ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.INACTIVE, ACCOUNT_STATUS.SUSPENDED, ACCOUNT_STATUS.PENDING],
    { errorMap: () => ({ message: 'Invalid account status' }) },
  ),
});

export const administratorListQuerySchema = paginationSchema.extend({
  role: adminRoleSchema.optional(),
  status: z
    .enum(
      [ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.INACTIVE, ACCOUNT_STATUS.SUSPENDED, ACCOUNT_STATUS.PENDING],
    )
    .optional(),
});

export const rolePermissionsSchema = z.object({
  permissions: z
    .array(z.string().trim().max(80))
    .max(300, 'Too many permissions')
    .refine(
      (list) => list.every((entry) => typeof entry === 'string' && entry.includes('.')),
      { message: 'Invalid permission key' },
    ),
});
