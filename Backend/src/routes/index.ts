import { Router, type Router as ExpressRouter } from "express";
import { adminUserRouter, userRouter } from "@/modules/user/user.route";
import {
  adminSellerApplicationRouter,
  sellerApplicationRouter,
} from "@/modules/seller/seller.route";
import {
  adminCategoryRouter,
  categoryRouter,
} from "@/modules/category/category.route";
import {
  adminMedicineRouter,
  medicineRouter,
  sellerMedicineRouter,
} from "@/modules/medicine/medicine.route";
import { cartRouter } from "@/modules/cart/cart.route";
import {
  adminOrderRouter,
  orderRouter,
  sellerOrderRouter,
} from "@/modules/order/order.route";
import {
  adminReviewRouter,
  reviewRouter,
} from "@/modules/review/review.route";
import { dashboardRouter } from "@/modules/dashboard/dashboard.route";

const entryRoutes: ExpressRouter = Router();

entryRoutes.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "MediStore API is running",
  });
});

entryRoutes.use("/users", userRouter);
entryRoutes.use("/admin/users", adminUserRouter);
entryRoutes.use("/seller/applications", sellerApplicationRouter);
entryRoutes.use("/admin/seller-applications", adminSellerApplicationRouter);
entryRoutes.use("/categories", categoryRouter);
entryRoutes.use("/admin/categories", adminCategoryRouter);
entryRoutes.use("/medicines", medicineRouter);
entryRoutes.use("/seller/medicines", sellerMedicineRouter);
entryRoutes.use("/admin/medicines", adminMedicineRouter);
entryRoutes.use("/cart", cartRouter);
entryRoutes.use("/orders", orderRouter);
entryRoutes.use("/seller/orders", sellerOrderRouter);
entryRoutes.use("/admin/orders", adminOrderRouter);
entryRoutes.use("/reviews", reviewRouter);
entryRoutes.use("/admin/reviews", adminReviewRouter);
entryRoutes.use("/dashboard", dashboardRouter);

export default entryRoutes;
