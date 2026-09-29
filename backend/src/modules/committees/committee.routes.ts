import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requireMemberAccount, requirePermission } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createCrudRouter } from '../../shared/crudRoutes';
import { committeeController } from './committee.controller';
import {
  assignPositionSchema,
  committeeListQuerySchema,
  createCommitteeSchema,
  updateCommitteeSchema,
  updatePositionSchema,
} from './committee.validation';

export const committeeRoutes = Router();

committeeRoutes.get(
  '/mine',
  authenticate,
  requireMemberAccount,
  committeeController.myCommittees,
);

committeeRoutes.get(
  '/breakdown',
  authenticate,
  requirePermission(PERMISSIONS.COMMITTEE_VIEW),
  committeeController.levelBreakdown,
);

committeeRoutes.post(
  '/:id/positions',
  authenticate,
  requirePermission(PERMISSIONS.COMMITTEE_UPDATE),
  validateBody(assignPositionSchema),
  committeeController.assignPosition,
);
committeeRoutes.patch(
  '/:id/positions/:positionId',
  authenticate,
  requirePermission(PERMISSIONS.COMMITTEE_UPDATE),
  validateBody(updatePositionSchema),
  committeeController.updatePosition,
);
committeeRoutes.delete(
  '/:id/positions/:positionId',
  authenticate,
  requirePermission(PERMISSIONS.COMMITTEE_UPDATE),
  committeeController.removePosition,
);

committeeRoutes.use(
  createCrudRouter({
    controller: committeeController,
    guards: {
      read: [authenticate, requirePermission(PERMISSIONS.COMMITTEE_VIEW)],
      create: [authenticate, requirePermission(PERMISSIONS.COMMITTEE_CREATE)],
      update: [authenticate, requirePermission(PERMISSIONS.COMMITTEE_UPDATE)],
      remove: [authenticate, requirePermission(PERMISSIONS.COMMITTEE_DELETE)],
    },
    validation: {
      list: [validateQuery(committeeListQuerySchema)],
      create: [validateBody(createCommitteeSchema)],
      update: [validateBody(updateCommitteeSchema)],
    },
  }),
);
