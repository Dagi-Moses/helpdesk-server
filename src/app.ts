import "express-async-errors"; // must be imported before routes are registered
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "@/config/swagger";
import { errorHandler, notFoundHandler } from "@/middleware/error.middleware";
import { logger } from "@/utils/logger";

import authRoutes from "@/modules/auth/auth.routes";
import ticketRoutes from "@/modules/tickets/ticket.routes";
import categoryRoutes from "@/modules/categories/category.routes";
import userRoutes from "@/modules/users/user.routes";
import departmentRoutes from "@/modules/departments/department.routes";
import attachmentDownloadRoutes from "@/modules/attachments/attachment-download.route";
import notificationRoutes from "@/modules/notifications/notification.routes";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
 app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()),
    credentials: true,
  })
);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use((req, _res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

  app.use(
    morgan("combined", {
      stream: { write: (message: string) => logger.info(message.trim()) },
    })
  );

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  const apiRouter = express.Router();
  apiRouter.use("/auth", authRoutes);
  apiRouter.use("/tickets", ticketRoutes);
  apiRouter.use("/categories", categoryRoutes);
  apiRouter.use("/users", userRoutes);
  apiRouter.use("/departments", departmentRoutes);
  apiRouter.use("/attachments", attachmentDownloadRoutes);
  apiRouter.use("/notifications", notificationRoutes);

  app.use("/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
