import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { SemesterService } from "./semester.service";

const createSemester = catchAsync(async (req: Request, res: Response) => {
  const result = await SemesterService.createSemester(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Academic Semester created successfully",
    data: result,
  });
});

const getAllSemesters = catchAsync(async (req: Request, res: Response) => {
  const isCurrent =
    req.query.isCurrent !== undefined
      ? req.query.isCurrent === "true"
      : undefined;

  const year = req.query.year ? Number(req.query.year) : undefined;

  const result = await SemesterService.getAllSemesters(req.query, {
    isCurrent,
    year,
    search: req.query.search as string,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Semesters retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSemesterById = catchAsync(async (req: Request, res: Response) => {
  const result = await SemesterService.getSemesterById(req.params.id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Semester details retrieved successfully",
    data: result,
  });
});

const updateSemester = catchAsync(async (req: Request, res: Response) => {
  const result = await SemesterService.updateSemester(
    req.user!.id,
    req.params.id as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Semester updated successfully",
    data: result,
  });
});

const softDeleteSemester = catchAsync(async (req: Request, res: Response) => {
  const result = await SemesterService.softDeleteSemester(
    req.user!.id,
    req.params.id as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Semester soft-deleted successfully",
    data: result,
  });
});

export const SemesterController = {
  createSemester,
  getAllSemesters,
  getSemesterById,
  updateSemester,
  softDeleteSemester,
};
