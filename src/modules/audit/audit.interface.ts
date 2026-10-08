import { IPaginationOptions } from "../../utils/pagination";

export interface ICreateAuditLogInput {
  userId?: string | null;
  action: string;
  resource: string;
  details?: string | Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface IAuditLogFilterParams {
  action?: string;
  resource?: string;
  userId?: string;
}

export interface IAuditLogPaginationOptions extends IPaginationOptions {}
