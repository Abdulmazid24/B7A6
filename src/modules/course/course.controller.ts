import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { CourseService } from "./course.service";
import { HTTP_STATUS } from "../../constants/status-codes";
import { RESPONSE_MESSAGES } from "../../constants/response-messages";

const createCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.createCourse(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    success: true,
    message: RESPONSE_MESSAGES.COURSE_CREATE_SUCCESS,
    data: result,
  });
});

const getAllCourses = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.getAllCourses(req.query, {
    departmentId: req.query.departmentId as string,
    search: req.query.search as string,
  });

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.COURSES_FETCH_SUCCESS,
    meta: result.meta,
    data: result.data,
  });
});

const getCourseById = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.getCourseById(req.params.id as string);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.COURSE_FETCH_SUCCESS,
    data: result,
  });
});

const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.updateCourse(
    req.user!.id,
    req.params.id as string,
    req.body
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.COURSE_UPDATE_SUCCESS,
    data: result,
  });
});

const softDeleteCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.softDeleteCourse(
    req.user!.id,
    req.params.id as string
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.COURSE_DELETE_SUCCESS,
    data: result,
  });
});

export const CourseController = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  softDeleteCourse,
};
