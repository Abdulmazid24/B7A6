import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { OfferingService } from "./offering.service";

const createOffering = catchAsync(async (req: Request, res: Response) => {
  const result = await OfferingService.createOffering(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Course offering created successfully",
    data: result,
  });
});

const addSection = catchAsync(async (req: Request, res: Response) => {
  const result = await OfferingService.addSectionToOffering(
    req.user!.id,
    req.params.id as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Section added to offering successfully",
    data: result,
  });
});

const getAllOfferings = catchAsync(async (req: Request, res: Response) => {
  const result = await OfferingService.getAllOfferings(req.query, {
    semesterId: req.query.semesterId as string,
    courseId: req.query.courseId as string,
    facultyId: req.query.facultyId as string,
    search: req.query.search as string,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course offerings retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getOfferingById = catchAsync(async (req: Request, res: Response) => {
  const result = await OfferingService.getOfferingById(req.params.id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Offering details retrieved successfully",
    data: result,
  });
});

const updateSection = catchAsync(async (req: Request, res: Response) => {
  const result = await OfferingService.updateSection(
    req.user!.id,
    req.params.sectionId as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Section updated successfully",
    data: result,
  });
});

const softDeleteOffering = catchAsync(async (req: Request, res: Response) => {
  const result = await OfferingService.softDeleteOffering(
    req.user!.id,
    req.params.id as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course offering deleted successfully",
    data: result,
  });
});

export const OfferingController = {
  createOffering,
  addSection,
  getAllOfferings,
  getOfferingById,
  updateSection,
  softDeleteOffering,
};
