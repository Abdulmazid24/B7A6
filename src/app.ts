import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { notFound } from "./middleware/not-found";
import { globalErrorHandler } from "./middleware/global-error";

const app: Application = express();

// Security HTTP headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5000",
      "http://localhost:5173",
      "https://documenter.getpostman.com",
    ],
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

// Stripe Webhook needs raw body, exclude it from standard json parser
app.use((req, res, next) => {
  if (req.originalUrl === "/api/v1/payments/webhook") {
    next();
  } else {
    express.json({ limit: "10mb" })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Welcome root route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
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
