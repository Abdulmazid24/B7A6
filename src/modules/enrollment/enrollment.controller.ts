import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { EnrollmentService } from "./enrollment.service";
import { HTTP_STATUS } from "../../constants/status-codes";
import { RESPONSE_MESSAGES } from "../../constants/response-messages";

const registerCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await EnrollmentService.registerCourse(
    req.user!.id,
    req.body.sectionId
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    success: true,
    message: RESPONSE_MESSAGES.COURSE_REGISTER_SUCCESS,
    data: result,
  });
});

const withdrawCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await EnrollmentService.withdrawCourse(
    req.user!.id,
    req.body.sectionId
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.COURSE_WITHDRAW_SUCCESS,
    data: result,
  });
});

const getMyEnrolledCourses = catchAsync(async (req: Request, res: Response) => {
  const result = await EnrollmentService.getMyEnrolledCourses(
    req.user!.id,
    req.query.semesterId as string
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.MY_COURSES_FETCH_SUCCESS,
    data: result,
  });
});

const getSectionRoster = catchAsync(async (req: Request, res: Response) => {
  const result = await EnrollmentService.getSectionRoster(
    req.params.sectionId as string
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.SECTION_ROSTER_FETCH_SUCCESS,
    data: result,
  });
});

export const EnrollmentController = {
  registerCourse,
  withdrawCourse,
  getMyEnrolledCourses,
  getSectionRoster,
};
