import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { AdminDashboardService } from "./admin.service";
import { HTTP_STATUS } from "../../constants/status-codes";
import { RESPONSE_MESSAGES } from "../../constants/response-messages";

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminDashboardService.getDashboardStats();

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.DASHBOARD_STATS_SUCCESS,
    data: result,
  });
});

export const AdminDashboardController = {
  getDashboardStats,
};
