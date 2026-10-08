import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { UserService } from "./user.service";
import { HTTP_STATUS } from "../../constants/status-codes";
import { RESPONSE_MESSAGES } from "../../constants/response-messages";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getMyProfile(req.user!.id);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.PROFILE_FETCH_SUCCESS,
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateMyProfile(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.PROFILE_UPDATE_SUCCESS,
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers(req.query, {
    search: req.query.search as string,
    role: req.query.role as string,
    status: req.query.status as string,
    departmentId: req.query.departmentId as string,
  });

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.USERS_FETCH_SUCCESS,
    meta: result.meta,
    data: result.data,
  });
});

const updateUserRoleStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateUserRoleStatus(
    req.user!.id,
    req.params.id as string,
    req.body
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.USER_ROLE_STATUS_UPDATE_SUCCESS,
    data: result,
  });
});

const softDeleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.softDeleteUser(req.user!.id, req.params.id as string);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.USER_DELETE_SUCCESS,
    data: result,
  });
});

export const UserController = {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  updateUserRoleStatus,
  softDeleteUser,
};
