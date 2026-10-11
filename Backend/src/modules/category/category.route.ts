import { Router, type Router as ExpressRouter } from "express";
import { UserRole } from "@/generated/prisma/enums";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";
import { validateRequest } from "@/middlewares/validateRequest";
import { categoryController } from "./category.controller";
import {
  categoryIdParamsRequestSchema,
  createCategoryRequestSchema,
  getCategoryParamsRequestSchema,
  listCategoriesRequestSchema,
  updateCategoryRequestSchema,
} from "./category.validation";

export const categoryRouter: ExpressRouter = Router();
export const adminCategoryRouter: ExpressRouter = Router();

categoryRouter.get(
  "/",
  validateRequest(listCategoriesRequestSchema),
  categoryController.listCategories,
);
categoryRouter.get(
  "/:idOrSlug",
  validateRequest(getCategoryParamsRequestSchema),
  categoryController.getCategory,
);

adminCategoryRouter.use(requireAuth, requireRole(UserRole.ADMIN));
adminCategoryRouter.post(
  "/",
  validateRequest(createCategoryRequestSchema),
  categoryController.createCategory,
);
adminCategoryRouter.patch(
  "/:id",
  validateRequest(updateCategoryRequestSchema),
  categoryController.updateCategory,
);
adminCategoryRouter.delete(
  "/:id",
  validateRequest(categoryIdParamsRequestSchema),
  categoryController.deleteCategory,
);
