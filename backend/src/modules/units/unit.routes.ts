import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createCrudRouter } from '../../shared/crudRoutes';
import { unitController } from './unit.controller';
import { createUnitSchema, unitListQuerySchema, updateUnitSchema } from './unit.validation';

const controller = unitController;

export const unitRoutes = Router();

/** Public directory endpoints. */
unitRoutes.get('/public', unitController.listPublic);
unitRoutes.get('/public/:id', unitController.getPublic);

/** Scoped options for pickers and filters. */
unitRoutes.get(
  '/options',
  authenticate,
  requirePermission(PERMISSIONS.UNIT_VIEW),
  unitController.options,
);

unitRoutes.use(
  createCrudRouter({
    controller,
    guards: {
      read: [authenticate, requirePermission(PERMISSIONS.UNIT_VIEW)],
      create: [authenticate, requirePermission(PERMISSIONS.UNIT_CREATE)],
      update: [authenticate, requirePermission(PERMISSIONS.UNIT_UPDATE)],
      remove: [authenticate, requirePermission(PERMISSIONS.UNIT_DELETE)],
    },
    validation: {
      list: [validateQuery(unitListQuerySchema)],
      create: [validateBody(createUnitSchema)],
      update: [validateBody(updateUnitSchema)],
    },
  }),
);

