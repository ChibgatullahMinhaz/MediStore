import type { Request, Response, NextFunction, RequestHandler } from "express";
import httpStatus from "http-status";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { catchAsync } from "@/utils/catchAsync";
import ApiError from "@/errors/ApiError";
import { UserStatus, type UserRole } from "@/generated/prisma/enums";

const attachActiveUser = async (req: Request): Promise<boolean> => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, status: true },
  });

  if (!user) {
    return false;
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `Your account has been ${user.status.toLowerCase()} by the admin.`,
    );
  }

  req.user = user;
  req.session = session.session;
  return true;
};

export const requireAuth: RequestHandler = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authenticated = await attachActiveUser(req);

    if (!authenticated) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "You are not logged in. Please log in to get access.",
      );
    }

    next();
  },
);

export const optionalAuth: RequestHandler = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    await attachActiveUser(req);
    next();
  },
);

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, "You are not logged in."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(httpStatus.FORBIDDEN, "Forbidden: You don't have permission to perform this action."));
    }

    next();
  };
};