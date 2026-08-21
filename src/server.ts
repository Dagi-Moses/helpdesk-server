import dotenv from "dotenv";
dotenv.config();

import { createApp } from "@/app";
import { logger } from "@/utils/logger";
import { prisma } from "@/config/prisma";

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";
const API_URL =
  process.env.API_URL || `http://localhost:${PORT}`;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info("Database connection established");

    const app = createApp();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API docs available at http://localhost:${PORT}/api-docs`);

  logger.info(`API docs available at ${API_URL}/api-docs`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
}

bootstrap();
