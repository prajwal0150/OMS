import type { Request, Response } from 'express';
import type { AuthUser } from '../../types/auth';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { makeCrudController } from '../../shared/crudController';
import { attendanceService } from './attendance.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const attendanceController = {
  ...makeCrudController(attendanceService, 'Attendance'),

  markBulk: asyncHandler(async (req, res: Response) => {
    const result = await attendanceService.markBulk(
      requireUser(req),
      req.body as Parameters<typeof attendanceService.markBulk>[1],
    );
    return ApiResponder.success(res, result, 'Attendance recorded successfully');
  }),

  markIndividual: asyncHandler(async (req, res: Response) => {
    const record = await attendanceService.markIndividual(
      requireUser(req),
      req.body as Parameters<typeof attendanceService.markIndividual>[1],
    );
    return ApiResponder.created(res, record, 'Attendance recorded successfully');
  }),

  eventRoster: asyncHandler(async (req, res: Response) => {
    const roster = await attendanceService.eventRoster(
      requireUser(req),
      String(req.params.eventId),
    );
    return ApiResponder.success(res, roster, 'Event attendance roster retrieved');
  }),

  summary: asyncHandler(async (req, res: Response) => {
    const summary = await attendanceService.summary(
      requireUser(req),
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, summary, 'Attendance summary retrieved');
  }),

  monthlyTrend: asyncHandler(async (req, res: Response) => {
    const trend = await attendanceService.monthlyTrend(
      requireUser(req),
      Number(req.query.months ?? 12),
    );
    return ApiResponder.success(res, trend, 'Attendance trend retrieved');
  }),

  participation: asyncHandler(async (req, res: Response) => {
    const data = await attendanceService.eventParticipation(
      requireUser(req),
      Number(req.query.limit ?? 8),
    );
    return ApiResponder.success(res, data, 'Event participation retrieved');
  }),

  myAttendance: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await attendanceService.myAttendance(
      requireUser(req),
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'Your attendance retrieved', 200, { pagination: meta });
  }),

  mySummary: asyncHandler(async (req, res: Response) => {
    const summary = await attendanceService.mySummary(requireUser(req));
    return ApiResponder.success(res, summary, 'Your attendance summary retrieved');
  }),
};
