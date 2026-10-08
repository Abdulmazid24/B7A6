import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { AdminDashboardService } from "./admin.service";

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminDashboardService.getDashboardStats();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin dashboard analytics and statistics retrieved successfully",
    data: result,
  });
});

export const AdminDashboardController = {
  getDashboardStats,
};
