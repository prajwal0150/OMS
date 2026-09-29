import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validateBody, validateQuery } from '../../middleware/validate';
import { reportController } from './report.controller';
import {
  dashboardAnalyticsQuerySchema,
  generateReportSchema,
  reportHistoryQuerySchema,
  trendQuerySchema,
} from './report.validation';

export const reportRoutes = Router();

/* ---- Analytics & dashboards ---- */
reportRoutes.get(
  '/dashboard',
  authenticate,
  requirePermission(PERMISSIONS.REPORT_VIEW),
  validateQuery(dashboardAnalyticsQuerySchema),
  reportController.dashboard,
);

reportRoutes.get(
  '/summary/district',
  authenticate,
  requirePermission(PERMISSIONS.REPORT_VIEW),
  reportController.districtSummary,
);

reportRoutes.get(
  '/summary/units',
  authenticate,
  requirePermission(PERMISSIONS.REPORT_VIEW),
  validateQuery(dashboardAnalyticsQuerySchema),
  reportController.unitBreakdown,
);

reportRoutes.get(
  '/summary/communities',
  authenticate,
  requirePermission(PERMISSIONS.REPORT_VIEW),
  validateQuery(dashboardAnalyticsQuerySchema),
  reportController.communityBreakdown,
);

reportRoutes.get(
  '/trend/membership',
  authenticate,
  requirePermission(PERMISSIONS.REPORT_VIEW),
  validateQuery(trendQuerySchema),
  reportController.membershipTrend,
);

/* ---- Generation, preview & history ---- */
reportRoutes.post(
  '/generate',
  authenticate,
  requirePermission(PERMISSIONS.REPORT_EXPORT),
  validateBody(generateReportSchema),
  reportController.generate,
);

reportRoutes.get(
  '/preview',
  authenticate,
  requirePermission(PERMISSIONS.REPORT_VIEW),
  reportController.preview,
);

reportRoutes.get(
  '/history',
  authenticate,
  requirePermission(PERMISSIONS.REPORT_VIEW),
  validateQuery(reportHistoryQuerySchema),
  reportController.history,
);

reportRoutes.get(
  '/history/:id',
  authenticate,
  requirePermission(PERMISSIONS.REPORT_VIEW),
  reportController.downloadSaved,
);

reportRoutes.delete(
  '/history/:id',
  authenticate,
  requirePermission(PERMISSIONS.REPORT_EXPORT),
  reportController.deleteSaved,
);
