import type { Request, Response } from 'express';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { settingsService } from './settings.service';
import type { AuthUser } from '../../types/auth';

export const settingsController = {
  overview: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user: AuthUser = req.user;
    return ApiResponder.success(res, await settingsService.overview(user), 'Settings retrieved');
  }),
};