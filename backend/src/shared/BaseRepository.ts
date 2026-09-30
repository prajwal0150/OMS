import mongoose from 'mongoose';
import type { FilterQuery, Model, PipelineStage, PopulateOptions, SortOrder } from 'mongoose';
import type { AuthUser } from '../types/auth';
import type { PaginationMeta } from '../types/api';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, parsePagination } from '../utils/pagination';
import { escapeRegex } from '../utils/strings';
import { buildScopeFilter } from './scope';

export interface BaseRepositoryOptions {
  searchFields?: string[];
  allowedSortFields?: string[];
  defaultSort?: string;
  defaultLimit?: number;
  populate?: string | PopulateOptions | (string | PopulateOptions)[];
}

export interface ListOptions {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, SortOrder>;
}

export interface ListResult<TDocument> {
  items: TDocument[];
  meta: PaginationMeta;
}

type QueryLike = Record<string, unknown>;

/**
 * Small reusable repository base class.
 * Module repositories extend it and add their own project specific queries.
 * Organizational scope is applied here so it can never be bypassed by a module.
 */
export class BaseRepository<TDocument extends mongoose.Document> {
  constructor(
    protected readonly model: Model<TDocument>,
    protected readonly options: BaseRepositoryOptions = {},
  ) {}

  get searchableFields(): string[] {
    return this.options.searchFields ?? [];
  }


  private getPopulateOptions(): any {
    return (this.options.populate ?? []) as any;
  }

  /**
   * Lean documents do not expose the `id` virtual, so it is re-attached here.
   * Without it, code that reads `document.id` silently receives `undefined`
   * (which used to update the wrong record or the first record in a collection).
   */
  private withId<TDocumentLike extends { _id?: unknown }>(
    document: TDocumentLike | null,
  ): TDocumentLike | null {
    if (!document) return null;
    return {
      ...(document as Record<string, unknown>),
      id: String(document._id),
    } as unknown as TDocumentLike;
  }

  buildSearchFilter(search?: string): FilterQuery<TDocument> {
    if (!search || search.trim().length === 0 || this.searchableFields.length === 0) {
      return {};
    }
    const pattern = new RegExp(escapeRegex(search.trim()), 'i');
    return {
      $or: this.searchableFields.map((field) => ({ [field]: pattern })),
    } as FilterQuery<TDocument>;
  }

  /** Merges caller filters, search terms and the caller's organizational scope. */
  buildFilter(
    user: AuthUser | null | undefined,
    filter: QueryLike = {},
    options: { search?: string; scopeOverrides?: QueryLike } = {},
  ): FilterQuery<TDocument> {
    const scopeFilter = buildScopeFilter(user, options.scopeOverrides ?? {});
    const searchFilter = this.buildSearchFilter(options.search);
    const conditions: QueryLike[] = [scopeFilter, searchFilter, filter].filter(
      (condition) => Object.keys(condition).length > 0,
    );
    if (conditions.length === 0) return {};
    if (conditions.length === 1) return conditions[0] as FilterQuery<TDocument>;
    return { $and: conditions } as FilterQuery<TDocument>;
  }

  parseListQuery(query: QueryLike = {}): ListOptions {
    return parsePagination(query, {
      allowedSortFields: this.options.allowedSortFields,
      defaultSort: this.options.defaultSort ?? 'createdAt',
      ...(this.options.defaultLimit ? { defaultLimit: this.options.defaultLimit } : {}),
    });
  }

  async list(
    user: AuthUser | null | undefined,
    query: QueryLike = {},
    filter: QueryLike = {},
  ): Promise<ListResult<TDocument>> {
    const { page, limit, skip, sort } = this.parseListQuery(query);
    const search = typeof query.search === 'string' ? query.search : undefined;
    const finalFilter = this.buildFilter(user, filter, search ? { search } : {});

    const [items, total] = await Promise.all([
      this.model
        .find(finalFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate(this.getPopulateOptions())
        .lean<TDocument[]>()
        .exec(),
      this.model.countDocuments(finalFilter).exec(),
    ]);

    return {
      items: items.map((item) => this.withId(item) as TDocument),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findById(id: string): Promise<TDocument | null> {
    if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid identifier');
    const document = await this.model
      .findById(id)
      .populate(this.getPopulateOptions())
      .lean<TDocument>()
      .exec();
    return this.withId(document);
  }

  async findOne(filter: QueryLike): Promise<TDocument | null> {
    const document = await this.model
      .findOne(filter as FilterQuery<TDocument>)
      .populate(this.getPopulateOptions())
      .lean<TDocument>()
      .exec();
    return this.withId(document);
  }

  async exists(filter: QueryLike): Promise<boolean> {
    const found = await this.model.exists(filter as FilterQuery<TDocument>).exec();
    return Boolean(found);
  }

  /** Finds a document and guarantees it lives inside the caller's scope. */
  async findByIdScoped(id: string, user: AuthUser, entityLabel = 'Record'): Promise<TDocument> {
    if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid identifier');
    const scopeFilter = buildScopeFilter(user);
    const conditions: QueryLike[] = [{ _id: id }, scopeFilter].filter(
      (condition) => Object.keys(condition).length > 0,
    );
    const document = await this.model
      .findOne({ $and: conditions } as FilterQuery<TDocument>)
      .populate(this.getPopulateOptions())
      .lean<TDocument>()
      .exec();

    if (!document) {
      throw ApiError.notFound(
        `${entityLabel} not found or outside your assigned organizational scope`,
      );
    }
    return this.withId(document) as TDocument;
  }

  async create(data: QueryLike): Promise<TDocument> {
    const created = await this.model.create(data);
    return created.toObject() as TDocument;
  }

  async insertMany(documents: QueryLike[]): Promise<TDocument[]> {
    const created = await this.model.insertMany(documents);
    return created as unknown as TDocument[];
  }

  async updateById(id: string, data: QueryLike): Promise<TDocument | null> {
    if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid identifier');
    const document = await this.model
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate(this.getPopulateOptions())
      .lean<TDocument>()
      .exec();
    return this.withId(document);
  }

  /** Scoped update â€” the caller may only touch documents inside their scope. */
  async updateScoped(
    id: string,
    user: AuthUser,
    data: QueryLike,
    entityLabel = 'Record',
  ): Promise<TDocument | null> {
    await this.findByIdScoped(id, user, entityLabel);
    return this.updateById(id, data);
  }

  async deleteById(id: string): Promise<boolean> {
    if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid identifier');
    const result = await this.model.findByIdAndDelete(id).exec();
    return Boolean(result);
  }

  async deleteScoped(id: string, user: AuthUser, entityLabel = 'Record'): Promise<boolean> {
    await this.findByIdScoped(id, user, entityLabel);
    return this.deleteById(id);
  }

  async count(user: AuthUser | null | undefined, filter: QueryLike = {}): Promise<number> {
    return this.model.countDocuments(this.buildFilter(user, filter)).exec();
  }

  async aggregate<R>(pipeline: PipelineStage[]): Promise<R[]> {
    return this.model.aggregate<R>(pipeline).exec();
  }

  /** Paginated aggregate, used by the reporting services. */
  async aggregatePaginated<R>(
    pipeline: PipelineStage[],
    page: number,
    limit: number,
  ): Promise<{ items: R[]; meta: PaginationMeta }> {
    const results = await this.aggregate<{ items: R[]; count: Array<{ total: number }> }>([
      ...pipeline,
      {
        $facet: {
          items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          count: [{ $count: 'total' }],
        },
      } as unknown as PipelineStage,
    ]);

    const bucket = results[0] ?? { items: [], count: [] };
    const total = bucket.count?.[0]?.total ?? 0;
    return { items: bucket.items ?? [], meta: buildPaginationMeta(total, page, limit) };
  }
}

