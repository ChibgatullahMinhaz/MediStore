import { Router, type Router as ExpressRouter } from "express";
import { UserRole } from "@/generated/prisma/enums";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";
import { validateRequest } from "@/middlewares/validateRequest";
import { orderController } from "./order.controller";
import {
  createOrderRequestSchema,
  listOrdersRequestSchema,
  orderIdParamsRequestSchema,
  updateOrderStatusRequestSchema,
} from "./order.validation";

export const orderRouter: ExpressRouter = Router();
export const sellerOrderRouter: ExpressRouter = Router();
export const adminOrderRouter: ExpressRouter = Router();

orderRouter.use(requireAuth, requireRole(UserRole.CUSTOMER));
orderRouter.post(
  "/",
  validateRequest(createOrderRequestSchema),
  orderController.createOrder,
);
orderRouter.get(
  "/",
  validateRequest(listOrdersRequestSchema),
  orderController.listCustomerOrders,
);
orderRouter.get(
  "/:id",
  validateRequest(orderIdParamsRequestSchema),
  orderController.getCustomerOrder,
);
orderRouter.post(
  "/:id/cancel",
  validateRequest(orderIdParamsRequestSchema),
  orderController.cancelCustomerOrder,
);

sellerOrderRouter.use(requireAuth, requireRole(UserRole.SELLER));
sellerOrderRouter.get(
  "/",
  validateRequest(listOrdersRequestSchema),
  orderController.listSellerOrders,
);
sellerOrderRouter.get(
  "/:id",
  validateRequest(orderIdParamsRequestSchema),
  orderController.getSellerOrder,
);
sellerOrderRouter.patch(
  "/:id/status",
  validateRequest(updateOrderStatusRequestSchema),
  orderController.updateSellerOrderStatus,
);

adminOrderRouter.use(requireAuth, requireRole(UserRole.ADMIN));
adminOrderRouter.get(
  "/",
  validateRequest(listOrdersRequestSchema),
  orderController.listAdminOrders,
);
adminOrderRouter.get(
  "/:id",
  validateRequest(orderIdParamsRequestSchema),
  orderController.getAdminOrder,
);
adminOrderRouter.patch(
  "/:id/status",
  validateRequest(updateOrderStatusRequestSchema),
  orderController.updateAdminOrderStatus,
);
