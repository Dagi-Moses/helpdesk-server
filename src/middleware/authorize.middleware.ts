import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AppError } from "@/utils/apiResponse";

/**
 * Restricts a route to one or more roles. Must run after authenticate().
 * Usage: router.get("/admin-only", authenticate, authorize(Role.ADMIN), handler)
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError("You do not have permission to perform this action", 403);
    }

    next();
  };
}
