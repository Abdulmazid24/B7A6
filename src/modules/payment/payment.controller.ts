import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { PaymentService } from "./payment.service";
import { HTTP_STATUS } from "../../constants/status-codes";
import { RESPONSE_MESSAGES } from "../../constants/response-messages";

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.createCheckoutSession(
    req.user!.id,
    req.body.tuitionFeeId
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.CHECKOUT_SESSION_CREATE_SUCCESS,
    data: result,
  });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  const result = await PaymentService.handleWebhook(req.body, signature);

  res.status(HTTP_STATUS.OK).json(result);
});

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const sessionId = (req.query.session_id || req.params.sessionId) as string;
  const result = await PaymentService.verifyPaymentSession(sessionId);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.PAYMENT_VERIFY_SUCCESS,
    data: result,
  });
});

const getMyInvoices = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getMyInvoices(req.user!.id);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.INVOICES_FETCH_SUCCESS,
    data: result,
  });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getAllPayments(req.query, {
    status: req.query.status as string,
    studentId: req.query.studentId as string,
  });

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.PAYMENTS_FETCH_SUCCESS,
    meta: result.meta,
    data: result.data,
  });
});

export const PaymentController = {
  createCheckoutSession,
  handleWebhook,
  verifyPayment,
  getMyInvoices,
  getAllPayments,
};
