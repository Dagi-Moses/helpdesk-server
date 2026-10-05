import { Request, Response } from "express";
import { DepartmentService } from "@/modules/departments/department.service";
import { ApiResponse } from "@/utils/apiResponse";

export const DepartmentController = {
  async create(req: Request, res: Response) {
    const department = await DepartmentService.create(req.body.name);
    return ApiResponse.created(res, department, "Department created");
  },
  async list(_req: Request, res: Response) {
    const departments = await DepartmentService.list();
    return ApiResponse.success(res, departments, "Departments retrieved");
  },
  async remove(req: Request, res: Response) {
    await DepartmentService.remove(req.params.id);
    return ApiResponse.noContent(res);
  },
};