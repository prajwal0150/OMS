import { Router } from 'express';
import type { RequestHandler } from 'express';
import { ApiResponder } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import type { AuthUser } from '../types/auth';
import type { PaginationMeta } from '../types/api';

interface CrudRouterController {
  list: RequestHandler;
  getById: RequestHandler;
  create: RequestHandler;
  update: RequestHandler;
  remove: RequestHandler;
  [key: string]: RequestHandler | unknown;
}

export interface CrudRouterOptions {
  controller: CrudRouterController;
  guards: {
    read: RequestHandler[];
    create: RequestHandler[];
    update: RequestHandler[];
    remove: RequestHandler[];
  };
  validation?: {
    list?: RequestHandler[];
    create?: RequestHandler[];
    update?: RequestHandler[];
  };
  idParam?: string;
}

/**
 * Creates the standard REST surface for a module.
 * Route → Middleware (auth/permission/validation) → Controller.
 */
export const createCrudRouter = (options: CrudRouterOptions): Router => {
  const router = Router();
  const idParam = options.idParam ?? 'id';
  const path = (suffix = '') => `/:${idParam}${suffix}`;

  router.get(
    '/',
    ...options.guards.read,
    ...(options.validation?.list ?? []),
    options.controller.list,
  );
  router.get(path(), ...options.guards.read, options.controller.getById);
  router.post(
    '/',
    ...options.guards.create,
    ...(options.validation?.create ?? []),
    options.controller.create,
  );
  router.patch(
    path(),
    ...options.guards.update,
    ...(options.validation?.update ?? []),
    options.controller.update,
  );
  router.delete(path(), ...options.guards.remove, options.controller.remove);

  return router;
};

/** Handler for endpoints that return a simple summary/key-value payload. */
export const summaryHandler = <TData>(
  resolver: (user: AuthUser, query: Record<string, unknown>) => Promise<TData>,
  message = 'Summary retrieved',
): RequestHandler =>
  asyncHandler(async (req, res) => {
    if (!req.user) throw new Error('Authenticated user missing on request');
    const data = await resolver(req.user, req.query as Record<string, unknown>);
    return ApiResponder.success(res, data, message);
  });

export const paginatedHandler = <TEntity>(
  resolver: (
    user: AuthUser,
    query: Record<string, unknown>,
  ) => Promise<{ items: TEntity[]; meta: PaginationMeta }>,
  message = 'Records retrieved',
): RequestHandler =>
  asyncHandler(async (req, res) => {
    if (!req.user) throw new Error('Authenticated user missing on request');
    const { items, meta } = await resolver(req.user, req.query as Record<string, unknown>);
    return ApiResponder.success(res, items, message, 200, { pagination: meta });
  });
