import { IPaginationOptions, calculatePagination } from "./pagination";

export interface IQueryBuilderConfig {
  searchableFields?: string[];
  exactFilterFields?: string[];
}

export interface IBuiltPrismaQuery {
  where: Record<string, any>;
  orderBy: Record<string, "asc" | "desc">;
  skip: number;
  take: number;
  meta: (total: number) => {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const buildPrismaQuery = (
  paginationOptions: IPaginationOptions,
  queryParams: Record<string, any>,
  config: IQueryBuilderConfig = {}
): IBuiltPrismaQuery => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);
  const where: Record<string, any> = { isDeleted: false };

  // 1. Full-text search across specified searchable fields
  const searchTerm = queryParams.search || queryParams.searchTerm;
  if (searchTerm && config.searchableFields && config.searchableFields.length > 0) {
    where.OR = config.searchableFields.map((field) => {
      // Support nested fields (e.g. "profile.firstName")
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        return {
          [parent!]: {
            [child!]: { contains: String(searchTerm), mode: "insensitive" },
          },
        };
      }
      return {
        [field]: { contains: String(searchTerm), mode: "insensitive" },
      };
    });
  }

  // 2. Exact match filtering across specified filterable fields
  if (config.exactFilterFields && config.exactFilterFields.length > 0) {
    for (const field of config.exactFilterFields) {
      if (queryParams[field] !== undefined && queryParams[field] !== null && queryParams[field] !== "") {
        let val = queryParams[field];
        if (val === "true") val = true;
        if (val === "false") val = false;
        if (!isNaN(Number(val)) && typeof val === "string" && !val.includes("-") && val.length < 5) {
          val = Number(val);
        }
        where[field] = val;
      }
    }
  }

  const orderBy: Record<string, "asc" | "desc"> = {
    [sortBy]: sortOrder,
  };

  const meta = (total: number) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });

  return {
    where,
    orderBy,
    skip,
    take: limit,
    meta,
  };
};
