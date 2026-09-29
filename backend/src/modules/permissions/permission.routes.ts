import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { permissionController } from './permission.controller';

/** Granular permission catalog. The catalog is seeded and read only at runtime. */
export const permissionRoutes = Router();

permissionRoutes.get('/', authenticate, permissionController.list);
permissionRoutes.get(
  '/grouped',
  authenticate,
  requirePermission(PERMISSIONS.PERMISSION_MANAGE),
  permissionController.grouped,
);