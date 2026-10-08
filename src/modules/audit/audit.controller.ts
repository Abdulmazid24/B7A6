import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { AuditService } from "./audit.service";

const getAllAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await AuditService.getAllAuditLogs(req.query, {
    action: req.query.action as string,
    resource: req.query.resource as string,
    userId: req.query.userId as string,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Audit logs retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const AuditController = {
  getAllAuditLogs,
};
