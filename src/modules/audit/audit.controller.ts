import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { AuditService } from "./audit.service";
import { HTTP_STATUS } from "../../constants/status-codes";
import { RESPONSE_MESSAGES } from "../../constants/response-messages";

const getAllAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await AuditService.getAllAuditLogs(req.query, {
    action: req.query.action as string,
    resource: req.query.resource as string,
    userId: req.query.userId as string,
  });

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.AUDIT_LOGS_FETCH_SUCCESS,
    meta: result.meta,
    data: result.data,
  });
});

export const AuditController = {
  getAllAuditLogs,
};
