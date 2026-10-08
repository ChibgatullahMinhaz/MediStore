import type { Request, Response, NextFunction, RequestHandler } from "express";
import httpStatus from "http-status";
import { auth } from "../lib/auth"; // Your better-auth instance
import { fromNodeHeaders } from "better-auth/node";
import { catchAsync } from "@/utils/catchAsync";
import ApiError from "@/errors/ApiError";
import type { User } from "better-auth";
import { UserStatus, type UserRole } from "@/generated/prisma/enums";

// 1. Require Auth (Only Logged-in Users)
export const requireAuth: RequestHandler = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "You are not logged in. Please log in to get access.");
  }

  req.user = session.user as User & { role: UserRole, status: UserStatus };

  if (req.user.status === 'BLOCKED') {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your account has been blocked by the admin. Please contact support."
    );
  }
  req.session = session.session;

  next();
});

// 2. Optional Auth (Public or Logged-in Users)
export const optionalAuth: RequestHandler = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session) {
      req.user = session.user as User & { role: UserRole, status: UserStatus };

      if (req.user.status === UserStatus.BLOCKED) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "Your account has been blocked by the admin. Please contact support."
        );
      }
      req.session = session.session;
    }
  } catch (error) {

  }
  next();
});

// 3. Role Guard (e.g., ADMIN or PROVIDER)
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, "You are not logged in."));
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      return next(new ApiError(httpStatus.FORBIDDEN, "Forbidden: You don't have permission to perform this action."));
    }

    next();
  };
};