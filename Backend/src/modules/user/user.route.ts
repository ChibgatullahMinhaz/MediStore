import { Router, type Router as ExpressRouter } from "express";
import { requireAuth, requireRole } from "@/middlewares/auth.middleware";
import { validateRequest } from "@/middlewares/validateRequest";
import { UserRole } from "@/generated/prisma/enums";
import { userController } from "./user.controller";
import {
  updateProfileBodySchema,
  updateUserStatusBodySchema,
  userIdParamsSchema,
} from "./user.validation";

export const userRouter: ExpressRouter = Router();
export const adminUserRouter: ExpressRouter = Router();

userRouter.use(requireAuth);
userRouter.get("/me", userController.getMyProfile);
userRouter.patch(
  "/me",
  validateRequest(updateProfileBodySchema),
  userController.updateMyProfile,
);

adminUserRouter.use(requireAuth, requireRole(UserRole.ADMIN));
adminUserRouter.get("/", userController.listUsers);
adminUserRouter.get(
  "/:id",
  validateRequest(userIdParamsSchema),
  userController.getUserById,
);
adminUserRouter.patch(
  "/:id/status",
  validateRequest(updateUserStatusBodySchema),
  userController.updateUserStatus,
);
