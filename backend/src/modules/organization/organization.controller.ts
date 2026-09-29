import type { Request, Response } from 'express';
import type { AuthUser } from '../../types/auth';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { AUDIT_ACTION } from '../../constants/enums';
import { auditLogService } from '../auditLogs/auditLog.service';
import { organizationService } from './organization.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const organizationController = {
  get: asyncHandler(async (req, res: Response) => {
    const profile = req.user
      ? await organizationService.getProfile()
      : await organizationService.getPublicProfile();
    return ApiResponder.success(res, profile, 'Organization profile retrieved');
  }),

  update: asyncHandler(async (req, res: Response) => {
    const profile = await organizationService.updateProfile(
      requireUser(req),
      req.body as Record<string, unknown>,
    );
    await auditLogService.recordFromRequest(
      req,
      AUDIT_ACTION.UPDATE,
      'Organization',
      String(profile._id),
      'Organization profile updated',
    );
    return ApiResponder.success(res, profile, 'Organization profile updated successfully');
  }),

  uploadLogo: asyncHandler(async (req, res: Response) => {
    const file = req.uploadedFiles?.[0];
    if (!file) throw ApiError.badRequest('No file uploaded');
    const profile = await organizationService.updateProfile(requireUser(req), {
      logo: file.url,
    });
    return ApiResponder.success(res, { logo: profile.logo, file }, 'Organization logo updated');
  }),
};
