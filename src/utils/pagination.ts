import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
  MAX_LIMIT,
} from "../constants/pagination";

export interface IPaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ICalculatePaginationResult {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const calculatePagination = (
  options: IPaginationOptions
): ICalculatePaginationResult => {
  const page = Math.max(1, Number(options.page) || DEFAULT_PAGE);
  const rawLimit = Number(options.limit) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const sortBy = options.sortBy || DEFAULT_SORT_BY;
  const sortOrder = options.sortOrder === "asc" ? "asc" : DEFAULT_SORT_ORDER;

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};
