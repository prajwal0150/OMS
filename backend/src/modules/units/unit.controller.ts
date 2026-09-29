import type { Request, Response } from 'express';
import type { AuthUser } from '../../types/auth';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { buildScopeFilter } from '../../shared/scope';
import { makeCrudController } from '../../shared/crudController';
import { unitService } from './unit.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

const base = makeCrudController(unitService, 'Unit');

export const unitController = {
  ...base,

  /** Public directory of active units. */
  listPublic: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await unitService.listPublic(
      { ...(req.query as Record<string, unknown>), status: 'ACTIVE' },
      { status: 'ACTIVE' },
    );
    return ApiResponder.success(res, items, 'Units retrieved', 200, { pagination: meta });
  }),

  getPublic: asyncHandler(async (req, res: Response) => {
    const unit = await unitService.getPublicById(String(req.params.id));
    return ApiResponder.success(res, unit, 'Unit retrieved');
  }),

  /** Scoped option list used by pickers. */
  options: asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const options = await unitService.getOptions(buildScopeFilter(user));
    return ApiResponder.success(res, options, 'Unit options retrieved');
  }),
};
