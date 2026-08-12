import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "@/utils/apiResponse";
import { logger } from "@/utils/logger";

// Must be registered LAST, after all routes.
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Known, expected application errors
  if (err instanceof AppError) {
    if (!err.isOperational || err.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, { stack: err.stack });
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Prisma known request errors (unique constraint, not found, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: `A record with this ${(err.meta?.target as string[])?.join(", ")} already exists`,
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
  }

  // Anything unexpected: log full detail, return a generic message
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, { stack: err.stack });
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
}

// 404 handler for unmatched routes
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
}
