import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { SemesterService } from "./semester.service";
import { HTTP_STATUS } from "../../constants/status-codes";
import { RESPONSE_MESSAGES } from "../../constants/response-messages";

const createSemester = catchAsync(async (req: Request, res: Response) => {
  const result = await SemesterService.createSemester(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    success: true,
    message: RESPONSE_MESSAGES.SEMESTER_CREATE_SUCCESS,
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
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.SEMESTERS_FETCH_SUCCESS,
    meta: result.meta,
    data: result.data,
  });
});

const getSemesterById = catchAsync(async (req: Request, res: Response) => {
  const result = await SemesterService.getSemesterById(req.params.id as string);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.SEMESTER_FETCH_SUCCESS,
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
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.SEMESTER_UPDATE_SUCCESS,
    data: result,
  });
});

const softDeleteSemester = catchAsync(async (req: Request, res: Response) => {
  const result = await SemesterService.softDeleteSemester(
    req.user!.id,
    req.params.id as string
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.SEMESTER_DELETE_SUCCESS,
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
