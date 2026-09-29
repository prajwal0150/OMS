import { Router } from 'express';
import { PERMISSIONS } from '../../constants/permissions';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/authorize';
import { validateQuery } from '../../middleware/validate';
import { z } from 'zod';
import { searchController } from './search.controller';

export const searchQuerySchema = z.object({
  q: z.string().trim().max(150).optional(),
  entities: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(10).optional(),
});

/** Cross entity search, always constrained by the caller's permissions and scope. */
export const searchRoutes = Router();

searchRoutes.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.ORGANIZATION_VIEW),
  validateQuery(searchQuerySchema),
  searchController.global,
);