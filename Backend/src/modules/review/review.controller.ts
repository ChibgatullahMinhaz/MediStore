import type { Request, RequestHandler } from "express";
import { UserRole } from "@/generated/prisma/enums";
import ApiError from "@/errors/ApiError";
import { catchAsync } from "@/utils/catchAsync";
import { sendResponse } from "@/utils/sendResponse";
import { reviewService } from "./review.service";
import {
  adminListReviewsQuerySchema,
  createReviewRequestSchema,
  listReviewsQuerySchema,
  medicineReviewsParamsRequestSchema,
  reviewIdParamsRequestSchema,
  updateReviewRequestSchema,
} from "./review.validation";

interface ReviewControllerHandlers {
  listMedicineReviews: RequestHandler;
  createReview: RequestHandler;
  listCustomerReviews: RequestHandler;
  updateReview: RequestHandler;
  deleteCustomerReview: RequestHandler;
  listAdminReviews: RequestHandler;
  deleteAdminReview: RequestHandler;
}

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user) {
    throw new ApiError(401, "You are not logged in.");
  }

  return req.user.id;
};

const listMedicineReviews: RequestHandler = catchAsync(async (req, res) => {
  const { medicineId } = medicineReviewsParamsRequestSchema.shape.params.parse(
    req.params,
  );
  const query = listReviewsQuerySchema.parse(req.query);
  const result = await reviewService.listMedicineReviews(medicineId, query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Medicine reviews retrieved successfully",
    meta: result.meta,
    data: {
      reviews: result.reviews,
      ratingSummary: result.ratingSummary,
    },
  });
});

const createReview: RequestHandler = catchAsync(async (req, res) => {
  const { params, body } = createReviewRequestSchema.parse({
    params: req.params,
    body: req.body,
  });
  const review = await reviewService.createReview(
    getAuthenticatedUserId(req),
    params.medicineId,
    body,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Review created successfully",
    data: review,
  });
});

const listCustomerReviews: RequestHandler = catchAsync(async (req, res) => {
  const query = listReviewsQuerySchema.parse(req.query);
  const result = await reviewService.listCustomerReviews(
    getAuthenticatedUserId(req),
    query,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your reviews retrieved successfully",
    meta: result.meta,
    data: result.reviews,
  });
});

const updateReview: RequestHandler = catchAsync(async (req, res) => {
  const { params, body } = updateReviewRequestSchema.parse({
    params: req.params,
    body: req.body,
  });
  const review = await reviewService.updateReview(
    getAuthenticatedUserId(req),
    params.id,
    body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review updated successfully",
    data: review,
  });
});

const deleteCustomerReview: RequestHandler = catchAsync(async (req, res) => {
  const { id } = reviewIdParamsRequestSchema.shape.params.parse(req.params);
  await reviewService.deleteCustomerReview(
    getAuthenticatedUserId(req),
    id,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review deleted successfully",
    data: null,
  });
});

const listAdminReviews: RequestHandler = catchAsync(async (req, res) => {
  const query = adminListReviewsQuerySchema.parse(req.query);
  const result = await reviewService.listAdminReviews(query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reviews retrieved successfully",
    meta: result.meta,
    data: result.reviews,
  });
});

const deleteAdminReview: RequestHandler = catchAsync(async (req, res) => {
  const { id } = reviewIdParamsRequestSchema.shape.params.parse(req.params);
  await reviewService.deleteAdminReview(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review deleted successfully",
    data: null,
  });
});

export const reviewController: ReviewControllerHandlers = {
  listMedicineReviews,
  createReview,
  listCustomerReviews,
  updateReview,
  deleteCustomerReview,
  listAdminReviews,
  deleteAdminReview,
};
