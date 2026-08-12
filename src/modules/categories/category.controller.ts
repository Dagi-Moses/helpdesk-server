import { Request, Response } from "express";
import { CategoryService } from "@/modules/categories/category.service";
import { ApiResponse } from "@/utils/apiResponse";

export const CategoryController = {
  async create(req: Request, res: Response) {
    const category = await CategoryService.create(req.body.name, req.body.description);
    return ApiResponse.created(res, category, "Category created");
  },

  async list(_req: Request, res: Response) {
    const categories = await CategoryService.list();
    return ApiResponse.success(res, categories, "Categories retrieved");
  },

  async update(req: Request, res: Response) {
    const category = await CategoryService.update(req.params.id, req.body);
    return ApiResponse.success(res, category, "Category updated");
  },

  async remove(req: Request, res: Response) {
    await CategoryService.remove(req.params.id);
    return ApiResponse.noContent(res);
  },
};
