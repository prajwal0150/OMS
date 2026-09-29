import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validateBody } from '../../middleware/validate';
import { uploadSingle } from '../../middleware/upload';
import { organizationController } from './organization.controller';
import { updateOrganizationSchema } from './organization.validation';

export const organizationRoutes = Router();

organizationRoutes.get('/public', organizationController.get);

organizationRoutes.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ORGANIZATION_VIEW),
  organizationController.get,
);

organizationRoutes.patch(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ORGANIZATION_UPDATE),
  validateBody(updateOrganizationSchema),
  organizationController.update,
);

organizationRoutes.post(
  '/logo',
  authenticate,
  requirePermission(PERMISSIONS.ORGANIZATION_UPDATE),
  ...uploadSingle('image', 'logo', 'organization'),
  organizationController.uploadLogo,
);

/** Public branding endpoint used by the public layout on first paint. */
organizationRoutes.get('/branding', optionalAuthenticate, organizationController.get);
