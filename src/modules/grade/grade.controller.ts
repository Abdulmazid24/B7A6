import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { GradeService } from "./grade.service";
import { HTTP_STATUS } from "../../constants/status-codes";
import { RESPONSE_MESSAGES } from "../../constants/response-messages";

const submitGrade = catchAsync(async (req: Request, res: Response) => {
  const result = await GradeService.submitGrade(req.user!, req.body);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.GRADE_SUBMIT_SUCCESS,
    data: result,
  });
});

const getSectionGrades = catchAsync(async (req: Request, res: Response) => {
  const result = await GradeService.getSectionGrades(
    req.user!,
    req.params.sectionId as string
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.SECTION_GRADES_FETCH_SUCCESS,
    data: result,
  });
});

const getMyTranscript = catchAsync(async (req: Request, res: Response) => {
  const result = await GradeService.getMyTranscript(req.user!.id);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.TRANSCRIPT_FETCH_SUCCESS,
    data: result,
  });
});

export const GradeController = {
  submitGrade,
  getSectionGrades,
  getMyTranscript,
};
