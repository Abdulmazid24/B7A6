import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { notFound } from "./middleware/not-found";
import { globalErrorHandler } from "./middleware/global-error";
import { requestLogger } from "./middleware/request-logger";

import { PaymentController } from "./modules/payment/payment.controller";
import { HTTP_STATUS } from "./constants/status-codes";

const app: Application = express();

// Request execution timing and status logger
app.use(requestLogger);

// Security HTTP headers
app.use(helmet());

// CORS Configuration - Allows web clients, Postman, and deployed frontends
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman) or any origin
      callback(null, true);
    },
    credentials: true,
  })
);

// Global Rate Limiting (Prevents DOS / API abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
    errors: [{ path: "", message: "Rate limit exceeded" }],
  },
});
app.use(limiter);

// Parse Cookie headers
app.use(cookieParser());

// Dedicated Stripe Webhook route with raw buffer for signature verification
app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleWebhook
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Welcome root route
app.get("/", (_req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Welcome to the University Management System (UMS) REST API",
    documentation: "See /postman/collection.json or README.md",
    version: "v1.0.0",
    status: "Active",
  });
});

// Mount Versioned API Routes
app.use("/api/v1", router);

// Centralized 404 handler
app.use(notFound);

// Centralized Global Error Handler
app.use(globalErrorHandler);

export default app;
