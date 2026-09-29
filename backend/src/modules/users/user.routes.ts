import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { userController } from './user.controller';

/**
 * Scoped directory of user accounts. Account lifecycle (creation, re-scoping,
 * activation) lives in /administrators; this module is read only by design.
 */
export const userRoutes = Router();

userRoutes.get('/', authenticate, requirePermission(PERMISSIONS.ADMIN_ACCOUNT_VIEW), userController.list);
userRoutes.get(
  '/options',
  authenticate,
  requirePermission(PERMISSIONS.ADMIN_ACCOUNT_VIEW),
  userController.options,
);
userRoutes.get(
  '/role-breakdown',
  authenticate,
  requirePermission(PERMISSIONS.ADMIN_ACCOUNT_VIEW),
  userController.roleBreakdown,
);
userRoutes.get('/:id', authenticate, requirePermission(PERMISSIONS.ADMIN_ACCOUNT_VIEW), userController.getById);