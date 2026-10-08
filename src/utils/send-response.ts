import { Response } from "express";

export interface IMetaResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: IMetaResponse;
  data: T;
}

export const sendResponse = <T>(res: Response, data: IApiResponse<T>) => {
  return res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    ...(data.meta ? { meta: data.meta } : {}),
    data: data.data,
  });
};
