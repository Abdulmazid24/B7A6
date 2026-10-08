import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { AuthService } from "./auth.service";
import { config } from "../../config";

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body, req.ip);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User registered successfully",
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
    statusCode: 200,
    success: true,
    message: "User logged in successfully",
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
    statusCode: 200,
    success: true,
    message: "Google login successful",
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
    statusCode: 200,
    success: true,
    message: "Access token refreshed successfully",
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.changePassword(req.user!.id, req.body, req.ip);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password changed successfully",
    data: result,
  });
});

const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie("refreshToken");

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Logged out successfully",
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
