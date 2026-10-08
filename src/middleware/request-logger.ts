import { Request, Response, NextFunction } from "express";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor =
      status >= 500 ? "🔴" : status >= 400 ? "🟡" : status >= 300 ? "🔵" : "🟢";

    if (process.env.NODE_ENV !== "test") {
      console.log(
        `${statusColor} [${req.method}] ${req.originalUrl} - ${status} (${duration}ms)`
      );
    }
  });

  next();
};
