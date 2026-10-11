import { Router, type Router as ExpressRouter } from "express";
import { UserRole } from "@/generated/prisma/enums";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";
import {
  handleUploadErrors,
  licenseDocumentUpload,
} from "@/middlewares/upload.middleware";
import { validateRequest } from "@/middlewares/validateRequest";
import { sellerController } from "./seller.controller";
import {
  applicationIdParamsSchema,
  createSellerApplicationBodySchema,
  listSellerApplicationsRequestSchema,
  reviewSellerApplicationBodySchema,
} from "./seller.validation";

export const sellerApplicationRouter: ExpressRouter = Router();
export const adminSellerApplicationRouter: ExpressRouter = Router();

sellerApplicationRouter.use(requireAuth);
sellerApplicationRouter.post(
  "/",
  requireRole(UserRole.CUSTOMER),
  licenseDocumentUpload.single("licenseDocument"),
  handleUploadErrors,
  validateRequest(createSellerApplicationBodySchema),
  sellerController.submitApplication,
);
sellerApplicationRouter.get("/me", sellerController.getMyApplication);

adminSellerApplicationRouter.use(
  requireAuth,
  requireRole(UserRole.ADMIN),
);
adminSellerApplicationRouter.get(
  "/",
  validateRequest(listSellerApplicationsRequestSchema),
  sellerController.listApplications,
);
adminSellerApplicationRouter.get(
  "/:id",
  validateRequest(applicationIdParamsSchema),
  sellerController.getApplicationById,
);
adminSellerApplicationRouter.patch(
  "/:id/review",
  validateRequest(reviewSellerApplicationBodySchema),
  sellerController.reviewApplication,
);
