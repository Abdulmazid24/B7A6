import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { EnrollmentService } from "./enrollment.service";

const registerCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await EnrollmentService.registerCourse(
    req.user!.id,
    req.body.sectionId
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Course registered successfully",
    data: result,
  });
});

const withdrawCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await EnrollmentService.withdrawCourse(
    req.user!.id,
    req.body.sectionId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course withdrawn successfully",
    data: result,
  });
});

const getMyEnrolledCourses = catchAsync(async (req: Request, res: Response) => {
  const result = await EnrollmentService.getMyEnrolledCourses(
    req.user!.id,
    req.query.semesterId as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Enrolled courses retrieved successfully",
    data: result,
  });
});

const getSectionRoster = catchAsync(async (req: Request, res: Response) => {
  const result = await EnrollmentService.getSectionRoster(
    req.params.sectionId as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Section student roster retrieved successfully",
    data: result,
  });
});

export const EnrollmentController = {
  registerCourse,
  withdrawCourse,
  getMyEnrolledCourses,
  getSectionRoster,
};
