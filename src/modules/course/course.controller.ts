import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { CourseService } from "./course.service";

const createCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.createCourse(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Course created successfully with prerequisites",
    data: result,
  });
});

const getAllCourses = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.getAllCourses(req.query, {
    departmentId: req.query.departmentId as string,
    search: req.query.search as string,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Courses retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getCourseById = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.getCourseById(req.params.id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course details retrieved successfully",
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
    statusCode: 200,
    success: true,
    message: "Course updated successfully",
    data: result,
  });
});

const softDeleteCourse = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.softDeleteCourse(
    req.user!.id,
    req.params.id as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course soft-deleted successfully",
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
