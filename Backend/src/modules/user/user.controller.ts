import type { Request, RequestHandler } from "express";
import { UserStatus } from "@/generated/prisma/enums";
import ApiError from "@/errors/ApiError";
import { catchAsync } from "@/utils/catchAsync";
import { sendResponse } from "@/utils/sendResponse";
import {
  listUsersQuerySchema,
  updateProfileBodySchema,
  updateUserStatusBodySchema,
  userIdParamsSchema,
} from "./user.validation";
import { userService } from "./user.service";

interface UserControllerHandlers {
  getMyProfile: RequestHandler;
  updateMyProfile: RequestHandler;
  listUsers: RequestHandler;
  getUserById: RequestHandler;
  updateUserStatus: RequestHandler;
}

const authenticatedUserId = (req: Request): string => {
  if (!req.user) {
    throw new ApiError(401, "You are not logged in.");
  }

  return req.user.id;
};

const getMyProfile: RequestHandler = catchAsync(async (req, res) => {
  const user = await userService.getProfile(authenticatedUserId(req));

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile retrieved successfully",
    data: user,
  });
});

const updateMyProfile: RequestHandler = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(
    authenticatedUserId(req),
    updateProfileBodySchema.shape.body.parse(req.body),
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

const listUsers: RequestHandler = catchAsync(async (req, res) => {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await userService.listUsers(query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully",
    meta: result.meta,
    data: result.users,
  });
});

const getUserById: RequestHandler = catchAsync(async (req, res) => {
  const { id: userId } = userIdParamsSchema.shape.params.parse(req.params);

  const user = await userService.getProfile(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
});

const updateUserStatus: RequestHandler = catchAsync(async (req, res) => {
  const { id: userId } = updateUserStatusBodySchema.shape.params.parse(
    req.params,
  );
  const body = updateUserStatusBodySchema.shape.body.parse(req.body);

  const user = await userService.updateUserStatus(
    authenticatedUserId(req),
    userId,
    body,
  );

  const action =
    body.status === UserStatus.ACTIVE ? "activated" : "status updated";

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `User ${action} successfully`,
    data: user,
  });
});

export const userController: UserControllerHandlers = {
  getMyProfile,
  updateMyProfile,
  listUsers,
  getUserById,
  updateUserStatus,
};
