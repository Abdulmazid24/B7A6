import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/status-codes";

export const notFound = (req: Request, res: Response) => {
  return res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `API Route Not Found: [${req.method}] ${req.originalUrl}`,
    errors: [
      {
        path: req.originalUrl,
        message: "The requested route does not exist on this server",
      },
    ],
  });
};
