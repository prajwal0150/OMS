import type { Request, Response } from 'express';
import type { AuthUser } from '../../types/auth';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { makeCrudController } from '../../shared/crudController';
import { buildScopeFilter } from '../../shared/scope';
import { eventService } from './event.service';

const requireUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};

export const eventController = {
  ...makeCrudController(eventService, 'Event'),

  listPublic: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await eventService.listPublic(
      req.query as Record<string, unknown>,
      { status: { $in: ['SCHEDULED', 'ONGOING', 'COMPLETED'] } },
    );
    return ApiResponder.success(res, items, 'Events retrieved', 200, { pagination: meta });
  }),

  getPublic: asyncHandler(async (req, res: Response) => {
    const event = await eventService.getPublicById(String(req.params.id));
    return ApiResponder.success(res, event, 'Event retrieved');
  }),

  upcoming: asyncHandler(async (req, res: Response) => {
    const events = await eventService.upcoming(
      buildScopeFilter(requireUser(req)),
      Number(req.query.limit ?? 6),
    );
    return ApiResponder.success(res, events, 'Upcoming events retrieved');
  }),

  monthly: asyncHandler(async (req, res: Response) => {
    const trend = await eventService.monthly(requireUser(req), Number(req.query.months ?? 12));
    return ApiResponder.success(res, trend, 'Event activity retrieved');
  }),

  myEvents: asyncHandler(async (req, res: Response) => {
    const { items, meta } = await eventService.myEvents(
      requireUser(req),
      req.query as Record<string, unknown>,
    );
    return ApiResponder.success(res, items, 'Your events retrieved', 200, { pagination: meta });
  }),
};

