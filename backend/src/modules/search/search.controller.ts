import type { Request, Response } from 'express';
import { ApiResponder } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { searchService } from './search.service';
import type { SearchEntity } from './search.service';
import type { AuthUser } from '../../types/auth';

const ALL_ENTITIES: SearchEntity[] = [
  'members',
  'units',
  'communities',
  'committees',
  'events',
  'announcements',
  'content',
  'documents',
];

export const searchController = {
  global: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user: AuthUser = req.user;
    const term = String(req.query.q ?? '').trim();
    if (term.length < 2) {
      return ApiResponder.success(res, { term, groups: [], total: 0 }, 'Enter at least two characters');
    }
    const requested = String(req.query.entities ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter((value): value is SearchEntity => (ALL_ENTITIES as string[]).includes(value));
    const entities = requested.length > 0 ? requested : ALL_ENTITIES;
    const limit = Math.min(10, Math.max(1, Number(req.query.limit ?? 5) || 5));

    const result = await searchService.search(user, term, entities, limit);
    return ApiResponder.success(res, result, 'Search completed');
  }),
};