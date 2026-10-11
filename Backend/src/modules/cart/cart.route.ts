import { Router, type Router as ExpressRouter } from "express";
import { UserRole } from "@/generated/prisma/enums";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";
import { validateRequest } from "@/middlewares/validateRequest";
import { cartController } from "./cart.controller";
import {
  addCartItemRequestSchema,
  cartItemParamsRequestSchema,
  updateCartItemRequestSchema,
} from "./cart.validation";

export const cartRouter: ExpressRouter = Router();

cartRouter.use(requireAuth, requireRole(UserRole.CUSTOMER));
cartRouter.get("/", cartController.getCart);
cartRouter.post(
  "/items",
  validateRequest(addCartItemRequestSchema),
  cartController.addItem,
);
cartRouter.patch(
  "/items/:medicineId",
  validateRequest(updateCartItemRequestSchema),
  cartController.updateItemQuantity,
);
cartRouter.delete(
  "/items/:medicineId",
  validateRequest(cartItemParamsRequestSchema),
  cartController.removeItem,
);
cartRouter.delete("/", cartController.clearCart);
