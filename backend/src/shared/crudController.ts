import type { RequestHandler } from 'express';
import type { AuthUser } from '../types/auth';
import type { ApiMeta, PaginationMeta } from '../types/api';
import { ApiResponder } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export interface CrudListResult<TEntity> {
  items: TEntity[];
  meta: PaginationMeta;
}

/**
 * Contract every module service satisfies so the generic CRUD controller and
 * router factories can be reused across modules (SOLID: dependency inversion).
 */
export interface CrudServiceContract<TEntity> {
  list(user: AuthUser, query: Record<string, unknown>): Promise<CrudListResult<TEntity>>;
  getById(user: AuthUser, id: string): Promise<TEntity>;
  create(user: AuthUser, payload: Record<string, unknown>): Promise<TEntity>;
  update(user: AuthUser, id: string, payload: Record<string, unknown>): Promise<TEntity>;
  remove(user: AuthUser, id: string): Promise<void>;
}

const requireUser = (user?: AuthUser): AuthUser => {
  if (!user) throw new Error('Authenticated user missing on request — route guard misconfigured');
  return user;
};

/** Builds thin controllers around a CRUD service. No business logic lives here. */
export const makeCrudController = <TEntity>(
  service: CrudServiceContract<TEntity>,
  entityLabel: string,
  options: { listMeta?: (user: AuthUser, query: Record<string, unknown>) => Promise<ApiMeta> } = {},
) => ({
  list: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const { items, meta } = await service.list(user, req.query as Record<string, unknown>);
    const extraMeta = options.listMeta
      ? await options.listMeta(user, req.query as Record<string, unknown>)
      : undefined;
    return ApiResponder.success(res, items, `${entityLabel} list retrieved`, 200, {
      pagination: meta,
      ...(extraMeta ?? {}),
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const entity = await service.getById(user, String(req.params.id));
    return ApiResponder.success(res, entity, `${entityLabel} retrieved`);
  }),

  create: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const entity = await service.create(user, req.body as Record<string, unknown>);
    return ApiResponder.created(res, entity, `${entityLabel} created successfully`);
  }),

  update: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    const entity = await service.update(
      user,
      String(req.params.id),
      req.body as Record<string, unknown>,
    );
    return ApiResponder.success(res, entity, `${entityLabel} updated successfully`);
  }),

  remove: asyncHandler(async (req, res) => {
    const user = requireUser(req.user);
    await service.remove(user, String(req.params.id));
    return ApiResponder.success(res, null, `${entityLabel} deleted successfully`);
  }),
});

export type CrudController<TEntity> = ReturnType<typeof makeCrudController<TEntity>>;

export interface CrudRouteGuards {
  read: RequestHandler[];
  create: RequestHandler[];
  update: RequestHandler[];
  remove: RequestHandler[];
}

export interface CrudRouteValidation {
  create?: RequestHandler[];
  update?: RequestHandler[];
  list?: RequestHandler[];
}
