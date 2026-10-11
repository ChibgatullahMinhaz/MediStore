import type { RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendResponse } from "@/utils/sendResponse";
import { categoryService } from "./category.service";
import {
  categoryIdParamsRequestSchema,
  createCategoryRequestSchema,
  getCategoryParamsRequestSchema,
  listCategoriesQuerySchema,
  updateCategoryRequestSchema,
} from "./category.validation";

interface CategoryControllerHandlers {
  createCategory: RequestHandler;
  listCategories: RequestHandler;
  getCategory: RequestHandler;
  updateCategory: RequestHandler;
  deleteCategory: RequestHandler;
}

const createCategory: RequestHandler = catchAsync(async (req, res) => {
  const { body } = createCategoryRequestSchema.parse({ body: req.body });
  const category = await categoryService.createCategory(body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Category created successfully",
    data: category,
  });
});

const listCategories: RequestHandler = catchAsync(async (req, res) => {
  const query = listCategoriesQuerySchema.parse(req.query);
  const result = await categoryService.listCategories(query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Categories retrieved successfully",
    meta: result.meta,
    data: result.categories,
  });
});

const getCategory: RequestHandler = catchAsync(async (req, res) => {
  const { idOrSlug } = getCategoryParamsRequestSchema.shape.params.parse(
    req.params,
  );
  const category = await categoryService.getCategoryByIdOrSlug(idOrSlug);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category retrieved successfully",
    data: category,
  });
});

const updateCategory: RequestHandler = catchAsync(async (req, res) => {
  const {
    params: { id },
    body,
  } = updateCategoryRequestSchema.parse({
    params: req.params,
    body: req.body,
  });
  const category = await categoryService.updateCategory(id, body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category updated successfully",
    data: category,
  });
});

const deleteCategory: RequestHandler = catchAsync(async (req, res) => {
  const { id } = categoryIdParamsRequestSchema.shape.params.parse(req.params);
  const category = await categoryService.deleteCategory(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category deleted successfully",
    data: category,
  });
});

export const categoryController: CategoryControllerHandlers = {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
