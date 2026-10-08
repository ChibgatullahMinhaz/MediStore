import { Router, type Router as ExpressRouter } from "express";

const entryRoutes: ExpressRouter = Router();

entryRoutes.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "MediStore API is running",
  });
});

export default entryRoutes;
