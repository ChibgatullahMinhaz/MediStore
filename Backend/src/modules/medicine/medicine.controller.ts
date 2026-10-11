import type { Request, RequestHandler } from "express";
import ApiError from "@/errors/ApiError";
import { catchAsync } from "@/utils/catchAsync";
import { sendResponse } from "@/utils/sendResponse";
import { medicineService } from "./medicine.service";
import {
  createMedicineRequestSchema,
  listMedicinesQuerySchema,
  medicineIdParamsRequestSchema,
  updateMedicineRequestSchema,
} from "./medicine.validation";

interface MedicineControllerHandlers {
  createSellerMedicine: RequestHandler;
  listPublicMedicines: RequestHandler;
  getPublicMedicine: RequestHandler;
  listSellerMedicines: RequestHandler;
  getSellerMedicine: RequestHandler;
  updateSellerMedicine: RequestHandler;
  deleteSellerMedicine: RequestHandler;
  listAdminMedicines: RequestHandler;
  getAdminMedicine: RequestHandler;
  updateAdminMedicine: RequestHandler;
  deleteAdminMedicine: RequestHandler;
}

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user) {
    throw new ApiError(401, "You are not logged in.");
  }

  return req.user.id;
};

const createSellerMedicine: RequestHandler = catchAsync(async (req, res) => {
  const { body, file } = createMedicineRequestSchema.parse({
    body: req.body,
    file: req.file,
  });
  const medicine = await medicineService.createMedicine(
    getAuthenticatedUserId(req),
    body,
    file,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Medicine created successfully",
    data: medicine,
  });
});

const listPublicMedicines: RequestHandler = catchAsync(async (req, res) => {
  const query = listMedicinesQuerySchema.parse(req.query);
  const result = await medicineService.listMedicines(query, {
    publicOnly: true,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Medicines retrieved successfully",
    meta: result.meta,
    data: result.medicines,
  });
});

const getPublicMedicine: RequestHandler = catchAsync(async (req, res) => {
  const { id } = medicineIdParamsRequestSchema.shape.params.parse(req.params);
  const medicine = await medicineService.findMedicine(id, {
    publicOnly: true,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Medicine retrieved successfully",
    data: medicine,
  });
});

const listSellerMedicines: RequestHandler = catchAsync(async (req, res) => {
  const query = listMedicinesQuerySchema.parse(req.query);
  const result = await medicineService.listMedicines(query, {
    sellerId: getAuthenticatedUserId(req),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Seller medicines retrieved successfully",
    meta: result.meta,
    data: result.medicines,
  });
});

const getSellerMedicine: RequestHandler = catchAsync(async (req, res) => {
  const { id } = medicineIdParamsRequestSchema.shape.params.parse(req.params);
  const medicine = await medicineService.findMedicine(id, {
    sellerId: getAuthenticatedUserId(req),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Medicine retrieved successfully",
    data: medicine,
  });
});

const updateSellerMedicine: RequestHandler = catchAsync(async (req, res) => {
  const { params, body, file } = updateMedicineRequestSchema.parse({
    params: req.params,
    body: req.body,
    file: req.file,
  });
  const medicine = await medicineService.updateMedicine(params.id, body, {
    sellerId: getAuthenticatedUserId(req),
    ...(file ? { file } : {}),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Medicine updated successfully",
    data: medicine,
  });
});

const deleteSellerMedicine: RequestHandler = catchAsync(async (req, res) => {
  const { id } = medicineIdParamsRequestSchema.shape.params.parse(req.params);
  const result = await medicineService.deleteMedicine(id, {
    sellerId: getAuthenticatedUserId(req),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Medicine deleted successfully",
    data: result,
  });
});

const listAdminMedicines: RequestHandler = catchAsync(async (req, res) => {
  const query = listMedicinesQuerySchema.parse(req.query);
  const result = await medicineService.listMedicines(query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Medicines retrieved successfully",
    meta: result.meta,
    data: result.medicines,
  });
});

const getAdminMedicine: RequestHandler = catchAsync(async (req, res) => {
  const { id } = medicineIdParamsRequestSchema.shape.params.parse(req.params);
  const medicine = await medicineService.findMedicine(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Medicine retrieved successfully",
    data: medicine,
  });
});

const updateAdminMedicine: RequestHandler = catchAsync(async (req, res) => {
  const { params, body, file } = updateMedicineRequestSchema.parse({
    params: req.params,
    body: req.body,
    file: req.file,
  });
  const medicine = await medicineService.updateMedicine(params.id, body, {
    ...(file ? { file } : {}),
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Medicine updated successfully",
    data: medicine,
  });
});

const deleteAdminMedicine: RequestHandler = catchAsync(async (req, res) => {
  const { id } = medicineIdParamsRequestSchema.shape.params.parse(req.params);
  const result = await medicineService.deleteMedicine(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Medicine deleted successfully",
    data: result,
  });
});

export const medicineController: MedicineControllerHandlers = {
  createSellerMedicine,
  listPublicMedicines,
  getPublicMedicine,
  listSellerMedicines,
  getSellerMedicine,
  updateSellerMedicine,
  deleteSellerMedicine,
  listAdminMedicines,
  getAdminMedicine,
  updateAdminMedicine,
  deleteAdminMedicine,
};
