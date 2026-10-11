import type { Request, RequestHandler } from "express";
import ApiError from "@/errors/ApiError";
import { catchAsync } from "@/utils/catchAsync";
import { sendResponse } from "@/utils/sendResponse";
import { cartService } from "./cart.service";
import {
  addCartItemRequestSchema,
  cartItemParamsRequestSchema,
  updateCartItemRequestSchema,
} from "./cart.validation";

interface CartControllerHandlers {
  getCart: RequestHandler;
  addItem: RequestHandler;
  updateItemQuantity: RequestHandler;
  removeItem: RequestHandler;
  clearCart: RequestHandler;
}

const getUserId = (req: Request): string => {
  if (!req.user) {
    throw new ApiError(401, "You are not logged in.");
  }

  return req.user.id;
};

const getCart: RequestHandler = catchAsync(async (req, res) => {
  const cart = await cartService.getCart(getUserId(req));

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Cart retrieved successfully",
    data: cart,
  });
});

const addItem: RequestHandler = catchAsync(async (req, res) => {
  const { body } = addCartItemRequestSchema.parse({ body: req.body });
  const cart = await cartService.addItem(getUserId(req), body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Item added to cart",
    data: cart,
  });
});

const updateItemQuantity: RequestHandler = catchAsync(async (req, res) => {
  const { params, body } = updateCartItemRequestSchema.parse({
    params: req.params,
    body: req.body,
  });
  const cart = await cartService.updateItemQuantity(
    getUserId(req),
    params.medicineId,
    body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Cart item quantity updated",
    data: cart,
  });
});

const removeItem: RequestHandler = catchAsync(async (req, res) => {
  const { params } = cartItemParamsRequestSchema.parse({
    params: req.params,
  });
  const cart = await cartService.removeItem(
    getUserId(req),
    params.medicineId,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Item removed from cart",
    data: cart,
  });
});

const clearCart: RequestHandler = catchAsync(async (req, res) => {
  const cart = await cartService.clearCart(getUserId(req));

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Cart cleared successfully",
    data: cart,
  });
});

export const cartController: CartControllerHandlers = {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
};
