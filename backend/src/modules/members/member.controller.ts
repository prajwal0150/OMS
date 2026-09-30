import type { Request, Response } from 'express';
import type { AccountStatus } from '../../constants/enums';
import type { AuthUser } from '../../types/auth';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { AUDIT_ACTION } from '../../constants/enums';
import { makeCrudController } from '../../shared/crudController';
import type { CrudServiceContract } from '../../shared/crudController';
import type { MemberDocument } from './member.model';

import { auditLogService } from '../auditLogs/auditLog.service';
import { memberService } from './member.service';
import { memberStatsService } from './memberStats.service';
import { memberAccountService } from './memberAccount.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const memberController = {
  ...makeCrudController(memberService as unknown as CrudServiceContract<MemberDocument>, 'Member'),

  create: asyncHandler(async (req, res: Response) => {
    const member = await memberService.create(requireUser(req), req.body as Record<string, unknown>);
    await auditLogService.recordFromRequest(
      req,
      AUDIT_ACTION.MEMBER_CREATION,
      'Member',
      String(member._id),
      `Member ${member.memberId} registered`,
    );
    return ApiResponder.created(res, member, 'Member registered successfully');
  }),

  update: asyncHandler(async (req, res: Response) => {
    const member = await memberService.update(
      requireUser(req),
      String(req.params.id),
      req.body as Record<string, unknown>,
    );
    await auditLogService.recordFromRequest(
      req,
      AUDIT_ACTION.UPDATE,
      'Member',
      String(member._id),
      `Member ${member.memberId} updated`,
    );
    return ApiResponder.success(res, member, 'Member updated successfully');
  }),

  remove: asyncHandler(async (req, res: Response) => {
    await memberService.remove(requireUser(req), String(req.params.id));
    await auditLogService.recordFromRequest(
      req,
      AUDIT_ACTION.DELETE,
      'Member',
      String(req.params.id),
      'Member deleted',
    );
    return ApiResponder.success(res, null, 'Member deleted successfully');
  }),

  /* Member portal */
  ownProfile: asyncHandler(async (req, res: Response) => {
    const profile = await memberService.getOwnProfile(requireUser(req));
    return ApiResponder.success(res, profile, 'Profile retrieved');
  }),

  updateOwnProfile: asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    if (!user.member) throw ApiError.forbidden('No member profile linked to this account');
    const member = await memberService.updateOwnProfile(
      user,
      user.member,
      req.body as Record<string, unknown>,
    );
    return ApiResponder.success(res, member, 'Profile updated successfully');
  }),

  summary: asyncHandler(async (req, res: Response) => {
    const summary = await memberStatsService.statusSummary(
      requireUser(req),
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, summary, 'Member summary retrieved');
  }),

  breakdowns: asyncHandler(async (req, res: Response) => {
    const user = requireUser(req);
    const query = req.query as Record<string, unknown>;
    const [byUnit, byCommunity, byGender, byMembershipType] = await Promise.all([
      memberStatsService.byUnit(user, query),
      memberStatsService.byCommunity(user, query),
      memberStatsService.byGender(user, query),
      memberStatsService.byMembershipType(user, query),
    ]);
    return ApiResponder.success(
      res,
      { byUnit, byCommunity, byGender, byMembershipType },
      'Member breakdowns retrieved',
    );
  }),

  /* Registration approvals (district level) */
  listRegistrationRequests: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await memberService.listRegistrationRequests(
      requireUser(req),
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'Registration requests retrieved', 200, {
      pagination: meta,
    });
  }),

  approveRegistration: asyncHandler(async (req, res: Response) => {
    const { note } = req.body as { note?: string };
    const member = await memberService.approveRegistration(
      requireUser(req),
      String(req.params.id),
      note,
    );
    await auditLogService.recordFromRequest(
      req,
      AUDIT_ACTION.APPROVE,
      'Member',
      String(member._id),
      `Member registration approved for ${String(member.memberId ?? '')}`.trim(),
    );
    return ApiResponder.success(res, member, 'Member registration approved');
  }),

  rejectRegistration: asyncHandler(async (req, res: Response) => {
    const { reason } = req.body as { reason: string };
    const member = await memberService.rejectRegistration(
      requireUser(req),
      String(req.params.id),
      reason,
    );
    await auditLogService.recordFromRequest(
      req,
      AUDIT_ACTION.REJECT,
      'Member',
      String(member._id),
      `Member registration rejected for ${String(member.memberId ?? '')}`.trim(),
    );
    return ApiResponder.success(res, member, 'Member registration rejected');
  }),

  /* Member accounts */
  createAccount: asyncHandler(async (req, res: Response) => {
    const result = await memberAccountService.createAccount(
      requireUser(req),
      String(req.params.id),
      req.body as Record<string, unknown>,
      req,
    );
    return ApiResponder.created(
      res,
      result,
      'Member account created. Share the temporary password securely.',
    );
  }),

  accountForMember: asyncHandler(async (req, res: Response) => {
    const account = await memberAccountService.getAccountForMember(
      requireUser(req),
      String(req.params.id),
    );
    return ApiResponder.success(res, account, 'Member account retrieved');
  }),

  listAccounts: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await memberAccountService.listAccounts(
      requireUser(req),
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'Member accounts retrieved', 200, {
      pagination: meta,
    });
  }),

  setAccountStatus: asyncHandler(async (req, res: Response) => {
    const { status } = req.body as { status: AccountStatus };
    const result = await memberAccountService.setStatus(
      requireUser(req),
      String(req.params.accountId),
      status,
      req,
    );
    return ApiResponder.success(res, result, `Account status updated to ${status}`);
  }),

  resetAccountPassword: asyncHandler(async (req, res: Response) => {
    const result = await memberAccountService.resetPassword(
      requireUser(req),
      String(req.params.accountId),
      req,
    );
    return ApiResponder.success(res, result, 'Account password reset successfully');
  }),
};
