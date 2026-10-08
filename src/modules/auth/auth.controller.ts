import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { AuthService } from "./auth.service";
import { config } from "../../config";
import { HTTP_STATUS } from "../../constants/status-codes";
import { RESPONSE_MESSAGES } from "../../constants/response-messages";

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body, req.ip);

  sendResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    success: true,
    message: RESPONSE_MESSAGES.REGISTER_SUCCESS,
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body, req.ip);

  // Set Refresh Token in secure HTTP-only cookie
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: config.env === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.LOGIN_SUCCESS,
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.googleLogin(req.body.idToken, req.ip);

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: config.env === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.GOOGLE_LOGIN_SUCCESS,
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const result = await AuthService.refreshToken(token);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.TOKEN_REFRESH_SUCCESS,
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.changePassword(req.user!.id, req.body, req.ip);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.PASSWORD_CHANGE_SUCCESS,
    data: result,
  });
});

const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie("refreshToken");

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.LOGOUT_SUCCESS,
    data: null,
  });
});

export const AuthController = {
  register,
  login,
  googleLogin,
  refreshToken,
  changePassword,
  logout,
};
