import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requireMemberAccount, requirePermission } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createCrudRouter } from '../../shared/crudRoutes';
import { eventController } from './event.controller';
import {
  createEventSchema,
  eventListQuerySchema,
  publicEventQuerySchema,
  updateEventSchema,
} from './event.validation';

export const eventRoutes = Router();

eventRoutes.get('/public', validateQuery(publicEventQuerySchema), eventController.listPublic);
eventRoutes.get('/public/:id', eventController.getPublic);
eventRoutes.get('/upcoming', authenticate, eventController.upcoming);
eventRoutes.get('/monthly', authenticate, eventController.monthly);
eventRoutes.get('/mine', authenticate, requireMemberAccount, eventController.myEvents);

eventRoutes.use(
  createCrudRouter({
    controller: eventController,
    guards: {
      read: [authenticate, requirePermission(PERMISSIONS.EVENT_VIEW)],
      create: [authenticate, requirePermission(PERMISSIONS.EVENT_CREATE)],
      update: [authenticate, requirePermission(PERMISSIONS.EVENT_UPDATE)],
      remove: [authenticate, requirePermission(PERMISSIONS.EVENT_DELETE)],
    },
    validation: {
      list: [validateQuery(eventListQuerySchema)],
      create: [validateBody(createEventSchema)],
      update: [validateBody(updateEventSchema)],
    },
  }),
);
