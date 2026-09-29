import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { settingsController } from './settings.controller';

/** Platform settings overview. Write operations live on the owning resources. */
export const settingsRoutes = Router();

settingsRoutes.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.ADMIN_ACCOUNT_VIEW),
  settingsController.overview,
);