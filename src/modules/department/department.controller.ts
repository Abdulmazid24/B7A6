import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { DepartmentService } from "./department.service";
import { HTTP_STATUS } from "../../constants/status-codes";
import { RESPONSE_MESSAGES } from "../../constants/response-messages";

const createDepartment = catchAsync(async (req: Request, res: Response) => {
  const result = await DepartmentService.createDepartment(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    success: true,
    message: RESPONSE_MESSAGES.DEPARTMENT_CREATE_SUCCESS,
    data: result,
  });
});

const getAllDepartments = catchAsync(async (req: Request, res: Response) => {
  const result = await DepartmentService.getAllDepartments(req.query, {
    search: req.query.search as string,
  });

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.DEPARTMENTS_FETCH_SUCCESS,
    meta: result.meta,
    data: result.data,
  });
});

const getDepartmentById = catchAsync(async (req: Request, res: Response) => {
  const result = await DepartmentService.getDepartmentById(req.params.id as string);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.DEPARTMENT_FETCH_SUCCESS,
    data: result,
  });
});

const updateDepartment = catchAsync(async (req: Request, res: Response) => {
  const result = await DepartmentService.updateDepartment(
    req.user!.id,
    req.params.id as string,
    req.body
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.DEPARTMENT_UPDATE_SUCCESS,
    data: result,
  });
});

const softDeleteDepartment = catchAsync(async (req: Request, res: Response) => {
  const result = await DepartmentService.softDeleteDepartment(
    req.user!.id,
    req.params.id as string
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.DEPARTMENT_DELETE_SUCCESS,
    data: result,
  });
});

export const DepartmentController = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  softDeleteDepartment,
};
