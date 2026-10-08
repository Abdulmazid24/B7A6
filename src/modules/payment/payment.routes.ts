import { Router, raw } from "express";
import { PaymentController } from "./payment.controller";
import { auth } from "../../middleware/auth";
import { USER_ROLES } from "../../constants/roles";
import { validateRequest } from "../../middleware/validate-request";
import { PaymentValidation } from "./payment.validation";

const router = Router();

// Stripe Webhook (Raw body required for signature verification)
router.post(
  "/webhook",
  raw({ type: "application/json" }),
  PaymentController.handleWebhook
);

// Payment Verification (Public/Redirect or Authenticated)
router.get("/verify", PaymentController.verifyPayment);
router.get("/verify/:sessionId", PaymentController.verifyPayment);

// Student Invoices & Payment Initiation
router.get("/my-invoices", auth(USER_ROLES.STUDENT), PaymentController.getMyInvoices);
router.post(
  "/create-checkout-session",
  auth(USER_ROLES.STUDENT),
  validateRequest(PaymentValidation.createCheckoutSessionValidationSchema),
  PaymentController.createCheckoutSession
);

// Admin Payment Ledger
router.get("/", auth(USER_ROLES.ADMIN), PaymentController.getAllPayments);

export const PaymentRoutes = router;
