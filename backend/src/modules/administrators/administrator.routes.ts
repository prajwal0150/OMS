import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requireAdministrator, requireAnyPermission, requirePermission } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
import { administratorController } from './administrator.controller';
import {
  administratorListQuerySchema,
  administratorStatusSchema,
  createAdministratorSchema,
  rolePermissionsSchema,
  updateAdministratorSchema,
  updateOwnAdministratorProfileSchema,
} from './administrator.validation';

export const administratorRoutes = Router();

/* ---------- Roles & permission catalog (read) ---------- */
administratorRoutes.get(
  '/roles',
  authenticate,
  administratorController.listRoles,
);
administratorRoutes.get(
  '/roles/catalog',
  authenticate,
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  administratorController.permissionCatalog,
);
administratorRoutes.get(
  '/roles/:id',
  authenticate,
  administratorController.getRole,
);
administratorRoutes.patch(
  '/roles/:id/permissions',
  authenticate,
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  validateBody(rolePermissionsSchema),
  administratorController.updateRolePermissions,
);

/* ---------- Administrator accounts ---------- */
administratorRoutes.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ADMIN_ACCOUNT_VIEW),
  validateQuery(administratorListQuerySchema),
  administratorController.list,
);

administratorRoutes.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ADMIN_ACCOUNT_CREATE),
  validateBody(createAdministratorSchema),
  administratorController.create,
);

/* ---------- Own account (self service) ---------- */
/*
 * Registered before `/:id` on purpose: Express matches in declaration order,
 * so a later `/:id` would otherwise capture the literal string "me" as an id.
 * Any administrator may read and edit their own account, so this needs no
 * `admin.account.*` permission — self service is not account administration.
 */
administratorRoutes.get(
  '/me',
  authenticate,
  requireAdministrator,
  administratorController.ownProfile,
);
administratorRoutes.patch(
  '/me',
  authenticate,
  requireAdministrator,
  validateBody(updateOwnAdministratorProfileSchema),
  administratorController.updateOwnProfile,
);

administratorRoutes.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.ADMIN_ACCOUNT_VIEW),
  administratorController.getById,
);

administratorRoutes.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.ADMIN_ACCOUNT_UPDATE),
  validateBody(updateAdministratorSchema),
  administratorController.update,
);

administratorRoutes.patch(
  '/:id/status',
  authenticate,
  requireAnyPermission(
    PERMISSIONS.ADMIN_ACCOUNT_ACTIVATE,
    PERMISSIONS.ADMIN_ACCOUNT_DEACTIVATE,
    PERMISSIONS.ADMIN_ACCOUNT_SUSPEND,
  ),
  validateBody(administratorStatusSchema),
  administratorController.setStatus,
);

administratorRoutes.post(
  '/:id/reset-password',
  authenticate,
  requirePermission(PERMISSIONS.ADMIN_ACCOUNT_RESET_PASSWORD),
  administratorController.resetPassword,
);

administratorRoutes.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.ADMIN_ACCOUNT_DELETE),
  administratorController.remove,
);
