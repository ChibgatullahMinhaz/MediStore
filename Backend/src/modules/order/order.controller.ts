import type { Request, RequestHandler } from "express";
import { UserRole } from "@/generated/prisma/enums";
import ApiError from "@/errors/ApiError";
import { catchAsync } from "@/utils/catchAsync";
import { sendResponse } from "@/utils/sendResponse";
import { orderService } from "./order.service";
import {
  createOrderRequestSchema,
  listOrdersQuerySchema,
  orderIdParamsRequestSchema,
  updateOrderStatusRequestSchema,
} from "./order.validation";

interface OrderControllerHandlers {
  createOrder: RequestHandler;
  listCustomerOrders: RequestHandler;
  getCustomerOrder: RequestHandler;
  cancelCustomerOrder: RequestHandler;
  listSellerOrders: RequestHandler;
  getSellerOrder: RequestHandler;
  updateSellerOrderStatus: RequestHandler;
  listAdminOrders: RequestHandler;
  getAdminOrder: RequestHandler;
  updateAdminOrderStatus: RequestHandler;
}

const getAuthenticatedUser = (
  req: Request,
): { id: string; role: UserRole } => {
  if (!req.user) {
    throw new ApiError(401, "You are not logged in.");
  }

  return req.user;
};

const createOrder: RequestHandler = catchAsync(async (req, res) => {
  const { body } = createOrderRequestSchema.parse({ body: req.body });
  const orders = await orderService.createFromCart(
    getAuthenticatedUser(req).id,
    body,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Order placed successfully",
    data: orders,
  });
});

const listCustomerOrders: RequestHandler = catchAsync(async (req, res) => {
  const query = listOrdersQuerySchema.parse(req.query);
  const result = await orderService.listOrders(query, {
    customerId: getAuthenticatedUser(req).id,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your orders retrieved successfully",
    meta: result.meta,
    data: result.orders,
  });
});

const getCustomerOrder: RequestHandler = catchAsync(async (req, res) => {
  const { id } = orderIdParamsRequestSchema.shape.params.parse(req.params);
  const order = await orderService.getOrder(id, {
    customerId: getAuthenticatedUser(req).id,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order retrieved successfully",
    data: order,
  });
});

const cancelCustomerOrder: RequestHandler = catchAsync(async (req, res) => {
  const { id } = orderIdParamsRequestSchema.shape.params.parse(req.params);
  const order = await orderService.cancelCustomerOrder(
    getAuthenticatedUser(req).id,
    id,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order cancelled successfully",
    data: order,
  });
});

const listSellerOrders: RequestHandler = catchAsync(async (req, res) => {
  const query = listOrdersQuerySchema.parse(req.query);
  const result = await orderService.listOrders(query, {
    sellerId: getAuthenticatedUser(req).id,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Seller orders retrieved successfully",
    meta: result.meta,
    data: result.orders,
  });
});

const getSellerOrder: RequestHandler = catchAsync(async (req, res) => {
  const { id } = orderIdParamsRequestSchema.shape.params.parse(req.params);
  const order = await orderService.getOrder(id, {
    sellerId: getAuthenticatedUser(req).id,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order retrieved successfully",
    data: order,
  });
});

const updateSellerOrderStatus: RequestHandler = catchAsync(
  async (req, res) => {
    const { params, body } = updateOrderStatusRequestSchema.parse({
      params: req.params,
      body: req.body,
    });
    const seller = getAuthenticatedUser(req);
    const order = await orderService.updateOrderStatus(
      params.id,
      body.status,
      UserRole.SELLER,
      seller.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  },
);

const listAdminOrders: RequestHandler = catchAsync(async (req, res) => {
  const query = listOrdersQuerySchema.parse(req.query);
  const result = await orderService.listOrders(query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Orders retrieved successfully",
    meta: result.meta,
    data: result.orders,
  });
});

const getAdminOrder: RequestHandler = catchAsync(async (req, res) => {
  const { id } = orderIdParamsRequestSchema.shape.params.parse(req.params);
  const order = await orderService.getOrder(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order retrieved successfully",
    data: order,
  });
});

const updateAdminOrderStatus: RequestHandler = catchAsync(
  async (req, res) => {
    const { params, body } = updateOrderStatusRequestSchema.parse({
      params: req.params,
      body: req.body,
    });
    const order = await orderService.updateOrderStatus(
      params.id,
      body.status,
      UserRole.ADMIN,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  },
);

export const orderController: OrderControllerHandlers = {
  createOrder,
  listCustomerOrders,
  getCustomerOrder,
  cancelCustomerOrder,
  listSellerOrders,
  getSellerOrder,
  updateSellerOrderStatus,
  listAdminOrders,
  getAdminOrder,
  updateAdminOrderStatus,
};
