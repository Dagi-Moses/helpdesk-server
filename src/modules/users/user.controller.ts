import { Request, Response } from "express";
import { UserService } from "@/modules/users/user.service";
import { ApiResponse } from "@/utils/apiResponse";

export const UserController = {
  async create(req: Request, res: Response) {
    const user = await UserService.create(req.body);
    return ApiResponse.created(res, user, "User created");
  },

  async list(req: Request, res: Response) {
    const users = await UserService.list({ role: req.query.role as never });
    return ApiResponse.success(res, users, "Users retrieved");
  },

  async getById(req: Request, res: Response) {
    const user = await UserService.getById(req.params.id);
    return ApiResponse.success(res, user, "User retrieved");
  },

  async update(req: Request, res: Response) {
    const user = await UserService.update(req.params.id, req.body);
    return ApiResponse.success(res, user, "User updated");
  },

  async deactivate(req: Request, res: Response) {
    const user = await UserService.deactivate(req.params.id);
    return ApiResponse.success(res, user, "User deactivated");
  },
};
