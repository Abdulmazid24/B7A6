import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { PaymentService } from "./payment.service";

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.createCheckoutSession(
    req.user!.id,
    req.body.tuitionFeeId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Stripe checkout session created successfully",
    data: result,
  });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  const result = await PaymentService.handleWebhook(req.body, signature);

  res.status(200).json(result);
});

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const sessionId = (req.query.session_id || req.params.sessionId) as string;
  const result = await PaymentService.verifyPaymentSession(sessionId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment status verified successfully",
    data: result,
  });
});

const getMyInvoices = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getMyInvoices(req.user!.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student tuition invoices and receipts retrieved successfully",
    data: result,
  });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getAllPayments(req.query, {
    status: req.query.status as string,
    studentId: req.query.studentId as string,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All university payments retrieved successfully",
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
