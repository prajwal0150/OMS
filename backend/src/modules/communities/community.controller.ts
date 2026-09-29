import type { Request, Response } from 'express';
import type { AuthUser } from '../../types/auth';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { buildScopeFilter } from '../../shared/scope';
import { makeCrudController } from '../../shared/crudController';
import { communityService } from './community.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const communityController = {
  ...makeCrudController(communityService, 'Community'),

  listPublic: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await communityService.listPublic(
      { ...(req.query as Record<string, unknown>), status: 'ACTIVE' },
      { status: 'ACTIVE' },
    );
    return ApiResponder.success(res, items, 'Communities retrieved', 200, { pagination: meta });
  }),

  getPublic: asyncHandler(async (req, res: Response) => {
    const community = await communityService.getPublicById(String(req.params.id));
    return ApiResponder.success(res, community, 'Community retrieved');
  }),

  options: asyncHandler(async (req, res: Response) => {
    const options = await communityService.getOptions(buildScopeFilter(requireUser(req)));
    return ApiResponder.success(res, options, 'Community options retrieved');
  }),
};
