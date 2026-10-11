import type { Request, RequestHandler } from "express";
import ApiError from "@/errors/ApiError";
import { catchAsync } from "@/utils/catchAsync";
import { sendResponse } from "@/utils/sendResponse";
import { dashboardService } from "./dashboard.service";

interface DashboardControllerHandlers {
  customerOverview: RequestHandler;
  sellerOverview: RequestHandler;
  adminOverview: RequestHandler;
}

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user) {
    throw new ApiError(401, "You are not logged in.");
  }

  return req.user.id;
};

const customerOverview: RequestHandler = catchAsync(async (req, res) => {
  const overview = await dashboardService.getCustomerOverview(
    getAuthenticatedUserId(req),
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Customer dashboard overview retrieved successfully",
    data: overview,
  });
});

const sellerOverview: RequestHandler = catchAsync(async (req, res) => {
  const overview = await dashboardService.getSellerOverview(
    getAuthenticatedUserId(req),
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Seller dashboard overview retrieved successfully",
    data: overview,
  });
});

const adminOverview: RequestHandler = catchAsync(async (_req, res) => {
  const overview = await dashboardService.getAdminOverview();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin dashboard overview retrieved successfully",
    data: overview,
  });
});

export const dashboardController: DashboardControllerHandlers = {
  customerOverview,
  sellerOverview,
  adminOverview,
};
