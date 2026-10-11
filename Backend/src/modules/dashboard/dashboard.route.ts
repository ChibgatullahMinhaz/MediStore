import { Router, type Router as ExpressRouter } from "express";
import { UserRole } from "@/generated/prisma/enums";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";
import { dashboardController } from "./dashboard.controller";

export const dashboardRouter: ExpressRouter = Router();

dashboardRouter.get(
  "/customer",
  requireAuth,
  requireRole(UserRole.CUSTOMER),
  dashboardController.customerOverview,
);
dashboardRouter.get(
  "/seller",
  requireAuth,
  requireRole(UserRole.SELLER),
  dashboardController.sellerOverview,
);
dashboardRouter.get(
  "/admin",
  requireAuth,
  requireRole(UserRole.ADMIN),
  dashboardController.adminOverview,
);
