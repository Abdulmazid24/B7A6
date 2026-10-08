import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { GradeService } from "./grade.service";

const submitGrade = catchAsync(async (req: Request, res: Response) => {
  const result = await GradeService.submitGrade(req.user!, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student marks and grades updated successfully",
    data: result,
  });
});

const getSectionGrades = catchAsync(async (req: Request, res: Response) => {
  const result = await GradeService.getSectionGrades(
    req.user!,
    req.params.sectionId as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Section grades retrieved successfully",
    data: result,
  });
});

const getMyTranscript = catchAsync(async (req: Request, res: Response) => {
  const result = await GradeService.getMyTranscript(req.user!.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Academic transcript retrieved successfully",
    data: result,
  });
});

export const GradeController = {
  submitGrade,
  getSectionGrades,
  getMyTranscript,
};
