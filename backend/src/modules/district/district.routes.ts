import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
import { districtController } from './district.controller';
import {
  createDistrictSchema,
  districtListQuerySchema,
  updateDistrictSchema,
} from './district.validation';

export const districtRoutes = Router();

districtRoutes.get('/public', districtController.publicProfile);

districtRoutes.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.DISTRICT_VIEW),
  validateQuery(districtListQuerySchema),
  districtController.list,
);

districtRoutes.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.DISTRICT_UPDATE),
  validateBody(createDistrictSchema),
  districtController.create,
);

districtRoutes.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.DISTRICT_VIEW),
  districtController.getById,
);

districtRoutes.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.DISTRICT_UPDATE),
  validateBody(updateDistrictSchema),
  districtController.update,
);
