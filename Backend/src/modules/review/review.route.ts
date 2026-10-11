import { Router, type Router as ExpressRouter } from "express";
import { UserRole } from "@/generated/prisma/enums";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";
import { validateRequest } from "@/middlewares/validateRequest";
import { reviewController } from "./review.controller";
import {
  adminListReviewsRequestSchema,
  createReviewRequestSchema,
  listReviewsRequestSchema,
  medicineReviewsParamsRequestSchema,
  reviewIdParamsRequestSchema,
  updateReviewRequestSchema,
} from "./review.validation";

export const reviewRouter: ExpressRouter = Router();
export const adminReviewRouter: ExpressRouter = Router();

reviewRouter.get(
  "/medicines/:medicineId",
  validateRequest(medicineReviewsParamsRequestSchema),
  validateRequest(listReviewsRequestSchema),
  reviewController.listMedicineReviews,
);

reviewRouter.use(requireAuth, requireRole(UserRole.CUSTOMER));
reviewRouter.post(
  "/medicines/:medicineId",
  validateRequest(createReviewRequestSchema),
  reviewController.createReview,
);
reviewRouter.get(
  "/me",
  validateRequest(listReviewsRequestSchema),
  reviewController.listCustomerReviews,
);
reviewRouter.patch(
  "/:id",
  validateRequest(updateReviewRequestSchema),
  reviewController.updateReview,
);
reviewRouter.delete(
  "/:id",
  validateRequest(reviewIdParamsRequestSchema),
  reviewController.deleteCustomerReview,
);

adminReviewRouter.use(requireAuth, requireRole(UserRole.ADMIN));
adminReviewRouter.get(
  "/",
  validateRequest(adminListReviewsRequestSchema),
  reviewController.listAdminReviews,
);
adminReviewRouter.delete(
  "/:id",
  validateRequest(reviewIdParamsRequestSchema),
  reviewController.deleteAdminReview,
);
