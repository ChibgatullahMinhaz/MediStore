import type { RequestHandler } from "express";
import { SellerApplicationStatus } from "@/generated/prisma/enums";
import ApiError from "@/errors/ApiError";
import { catchAsync } from "@/utils/catchAsync";
import { sendResponse } from "@/utils/sendResponse";
import {
  applicationIdParamsSchema,
  createSellerApplicationBodySchema,
  listSellerApplicationsQuerySchema,
  reviewSellerApplicationBodySchema,
} from "./seller.validation";
import { sellerService } from "./seller.service";

interface SellerControllerHandlers {
  submitApplication: RequestHandler;
  getMyApplication: RequestHandler;
  listApplications: RequestHandler;
  getApplicationById: RequestHandler;
  reviewApplication: RequestHandler;
}

const submitApplication: RequestHandler = catchAsync(async (req, res) => {
  const { body, file } = createSellerApplicationBodySchema.parse({
    body: req.body,
    file: req.file,
  });

  if (!req.user) {
    throw new ApiError(401, "You are not logged in.");
  }

  const application = await sellerService.createOrResubmitApplication(
    req.user.id,
    body,
    file,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Seller application submitted successfully",
    data: application,
  });
});

const getMyApplication: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "You are not logged in.");
  }

  const application = await sellerService.getMyApplication(req.user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Seller application retrieved successfully",
    data: application,
  });
});

const listApplications: RequestHandler = catchAsync(async (req, res) => {
  const query = listSellerApplicationsQuerySchema.parse(req.query);
  const result = await sellerService.listApplications(query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Seller applications retrieved successfully",
    meta: result.meta,
    data: result.applications,
  });
});

const getApplicationById: RequestHandler = catchAsync(async (req, res) => {
  const { id } = applicationIdParamsSchema.shape.params.parse(req.params);
  const application = await sellerService.getApplicationById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Seller application retrieved successfully",
    data: application,
  });
});

const reviewApplication: RequestHandler = catchAsync(async (req, res) => {
  const { id } = reviewSellerApplicationBodySchema.shape.params.parse(
    req.params,
  );
  const body = reviewSellerApplicationBodySchema.shape.body.parse(req.body);

  if (!req.user) {
    throw new ApiError(401, "You are not logged in.");
  }

  const application = await sellerService.reviewApplication(
    req.user.id,
    id,
    body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message:
      body.status === SellerApplicationStatus.APPROVED
        ? "Seller application approved"
        : "Seller application rejected",
    data: application,
  });
});

export const sellerController: SellerControllerHandlers = {
  submitApplication,
  getMyApplication,
  listApplications,
  getApplicationById,
  reviewApplication,
};
