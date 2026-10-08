import { Request, Response } from "express";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { OfferingService } from "./offering.service";
import { HTTP_STATUS } from "../../constants/status-codes";
import { RESPONSE_MESSAGES } from "../../constants/response-messages";

const createOffering = catchAsync(async (req: Request, res: Response) => {
  const result = await OfferingService.createOffering(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    success: true,
    message: RESPONSE_MESSAGES.OFFERING_CREATE_SUCCESS,
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
    statusCode: HTTP_STATUS.CREATED,
    success: true,
    message: RESPONSE_MESSAGES.SECTION_CREATE_SUCCESS,
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
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.OFFERINGS_FETCH_SUCCESS,
    meta: result.meta,
    data: result.data,
  });
});

const getOfferingById = catchAsync(async (req: Request, res: Response) => {
  const result = await OfferingService.getOfferingById(req.params.id as string);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.OFFERING_FETCH_SUCCESS,
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
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.SECTION_UPDATE_SUCCESS,
    data: result,
  });
});

const softDeleteOffering = catchAsync(async (req: Request, res: Response) => {
  const result = await OfferingService.softDeleteOffering(
    req.user!.id,
    req.params.id as string
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: RESPONSE_MESSAGES.OFFERING_DELETE_SUCCESS,
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
