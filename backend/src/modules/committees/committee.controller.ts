import type { Request, Response } from 'express';
import type { AuthUser } from '../../types/auth';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { AUDIT_ACTION } from '../../constants/enums';
import { makeCrudController } from '../../shared/crudController';
import { auditLogService } from '../auditLogs/auditLog.service';
import { committeeService } from './committee.service';
import type { PositionInput } from './committee.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const committeeController = {
  ...makeCrudController(committeeService, 'Committee'),

  assignPosition: asyncHandler(async (req, res: Response) => {
    const committee = await committeeService.assignPosition(
      requireUser(req),
      String(req.params.id),
      req.body as PositionInput,
    );
    await auditLogService.recordFromRequest(
      req,
      AUDIT_ACTION.UPDATE,
      'Committee',
      String(committee._id),
      `Committee position assigned in ${committee.name}`,
    );
    return ApiResponder.success(res, committee, 'Position assigned successfully');
  }),

  updatePosition: asyncHandler(async (req, res: Response) => {
    const committee = await committeeService.updatePosition(
      requireUser(req),
      String(req.params.id),
      String(req.params.positionId),
      req.body as Partial<PositionInput>,
    );
    return ApiResponder.success(res, committee, 'Position updated successfully');
  }),

  removePosition: asyncHandler(async (req, res: Response) => {
    const committee = await committeeService.removePosition(
      requireUser(req),
      String(req.params.id),
      String(req.params.positionId),
    );
    return ApiResponder.success(res, committee, 'Position removed successfully');
  }),

  levelBreakdown: asyncHandler(async (req, res: Response) => {
    const breakdown = await committeeService.levelBreakdown(
      requireUser(req),
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, breakdown, 'Committee breakdown retrieved');
  }),

  /** Member portal: committees the signed in member belongs to. */
  myCommittees: asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    if (!user.member) throw ApiError.forbidden('No member profile linked to this account');
    const committees = await committeeService.listForMember(user.member);
    return ApiResponder.success(res, committees, 'Your committees retrieved');
  }),
};
