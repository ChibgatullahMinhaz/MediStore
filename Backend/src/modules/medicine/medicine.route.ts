import { Router, type Router as ExpressRouter } from "express";
import { UserRole } from "@/generated/prisma/enums";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";
import {
  handleUploadErrors,
  imageUpload,
} from "@/middlewares/upload.middleware";
import { validateRequest } from "@/middlewares/validateRequest";
import { medicineController } from "./medicine.controller";
import {
  createMedicineRequestSchema,
  listMedicinesRequestSchema,
  medicineIdParamsRequestSchema,
  updateMedicineRequestSchema,
} from "./medicine.validation";

export const medicineRouter: ExpressRouter = Router();
export const sellerMedicineRouter: ExpressRouter = Router();
export const adminMedicineRouter: ExpressRouter = Router();

medicineRouter.get(
  "/",
  validateRequest(listMedicinesRequestSchema),
  medicineController.listPublicMedicines,
);
medicineRouter.get(
  "/:id",
  validateRequest(medicineIdParamsRequestSchema),
  medicineController.getPublicMedicine,
);

sellerMedicineRouter.use(
  requireAuth,
  requireRole(UserRole.SELLER),
);
sellerMedicineRouter.get(
  "/",
  validateRequest(listMedicinesRequestSchema),
  medicineController.listSellerMedicines,
);
sellerMedicineRouter.get(
  "/:id",
  validateRequest(medicineIdParamsRequestSchema),
  medicineController.getSellerMedicine,
);
sellerMedicineRouter.post(
  "/",
  imageUpload.single("image"),
  handleUploadErrors,
  validateRequest(createMedicineRequestSchema),
  medicineController.createSellerMedicine,
);
sellerMedicineRouter.patch(
  "/:id",
  imageUpload.single("image"),
  handleUploadErrors,
  validateRequest(updateMedicineRequestSchema),
  medicineController.updateSellerMedicine,
);
sellerMedicineRouter.delete(
  "/:id",
  validateRequest(medicineIdParamsRequestSchema),
  medicineController.deleteSellerMedicine,
);

adminMedicineRouter.use(requireAuth, requireRole(UserRole.ADMIN));
adminMedicineRouter.get(
  "/",
  validateRequest(listMedicinesRequestSchema),
  medicineController.listAdminMedicines,
);
adminMedicineRouter.get(
  "/:id",
  validateRequest(medicineIdParamsRequestSchema),
  medicineController.getAdminMedicine,
);
adminMedicineRouter.patch(
  "/:id",
  imageUpload.single("image"),
  handleUploadErrors,
  validateRequest(updateMedicineRequestSchema),
  medicineController.updateAdminMedicine,
);
adminMedicineRouter.delete(
  "/:id",
  validateRequest(medicineIdParamsRequestSchema),
  medicineController.deleteAdminMedicine,
);
