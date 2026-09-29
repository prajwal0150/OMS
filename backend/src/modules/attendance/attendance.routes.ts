import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requireMemberAccount, requirePermission } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createCrudRouter } from '../../shared/crudRoutes';
import { attendanceController } from './attendance.controller';
import {
  attendanceListQuerySchema,
  bulkAttendanceSchema,
  individualAttendanceSchema,
  updateAttendanceSchema,
} from './attendance.validation';

export const attendanceRoutes = Router();

attendanceRoutes.get('/mine', authenticate, requireMemberAccount, attendanceController.myAttendance);
attendanceRoutes.get(
  '/mine/summary',
  authenticate,
  requireMemberAccount,
  attendanceController.mySummary,
);
attendanceRoutes.get(
  '/summary',
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  attendanceController.summary,
);
attendanceRoutes.get(
  '/trend',
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  attendanceController.monthlyTrend,
);
attendanceRoutes.get(
  '/participation',
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  attendanceController.participation,
);
attendanceRoutes.get(
  '/events/:eventId/roster',
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW),
  attendanceController.eventRoster,
);
attendanceRoutes.post(
  '/bulk',
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_CREATE),
  validateBody(bulkAttendanceSchema),
  attendanceController.markBulk,
);
attendanceRoutes.post(
  '/mark',
  authenticate,
  requirePermission(PERMISSIONS.ATTENDANCE_CREATE),
  validateBody(individualAttendanceSchema),
  attendanceController.markIndividual,
);

attendanceRoutes.use(
  createCrudRouter({
    controller: attendanceController,
    guards: {
      read: [authenticate, requirePermission(PERMISSIONS.ATTENDANCE_VIEW)],
      create: [authenticate, requirePermission(PERMISSIONS.ATTENDANCE_CREATE)],
      update: [authenticate, requirePermission(PERMISSIONS.ATTENDANCE_UPDATE)],
      remove: [authenticate, requirePermission(PERMISSIONS.ATTENDANCE_UPDATE)],
    },
    validation: {
      list: [validateQuery(attendanceListQuerySchema)],
      update: [validateBody(updateAttendanceSchema)],
    },
  }),
);
