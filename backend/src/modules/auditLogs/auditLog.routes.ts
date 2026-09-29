import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validateQuery } from '../../middleware/validate';
import { auditLogController } from './auditLog.controller';
import { auditLogQuerySchema } from './auditLog.validation';

export const auditLogRoutes = Router();

auditLogRoutes.get(
  '/summary',
  authenticate,
  requirePermission(PERMISSIONS.AUDIT_VIEW),
  auditLogController.summary,
);

auditLogRoutes.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.AUDIT_VIEW),
  validateQuery(auditLogQuerySchema),
  auditLogController.list,
);

auditLogRoutes.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.AUDIT_VIEW),
  auditLogController.getById,
);
