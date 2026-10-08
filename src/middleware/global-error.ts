import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";
import { config } from "../config";

interface IErrorDetail {
  path: string | number;
  message: string;
}

export const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errors: IErrorDetail[] = [];

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    errors = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  }
  // Handle Custom Operational AppError
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = [
      {
        path: "",
        message: err.message,
      },
    ];
  }
  // Handle Prisma Known Request Errors
  else if (err.name === "PrismaClientKnownRequestError") {
    if (err.code === "P2002") {
      statusCode = 409;
      message = "Duplicate Key Conflict";
      const target = err.meta?.target || "Field";
      errors = [
        {
          path: Array.isArray(target) ? target.join(", ") : String(target),
          message: "A record with this unique field already exists",
        },
      ];
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record Not Found";
      errors = [
        {
          path: "",
          message: err.meta?.cause || "Requested database record does not exist",
        },
      ];
    } else if (err.code === "P2003") {
      statusCode = 400;
      message = "Foreign Key Constraint Violation";
      errors = [
        {
          path: String(err.meta?.field_name || ""),
          message: "Referenced related resource does not exist",
        },
      ];
    } else {
      statusCode = 400;
      message = err.message || "Database Operation Error";
      errors = [{ path: "", message: err.message }];
    }
  }
  // Handle JWT Errors
  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid Authentication Token";
    errors = [{ path: "authorization", message: "Token signature is invalid" }];
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication Token Expired";
    errors = [{ path: "authorization", message: "Token has expired. Please login again" }];
  }
  // Standard Error fallback
  else if (err instanceof Error) {
    message = err.message;
    errors = [{ path: "", message: err.message }];
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(config.env === "development" ? { stack: err.stack } : {}),
  });
};
