import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/apiResponse";

export const DepartmentService = {
  async create(name: string) {
    return prisma.department.create({ data: { name } });
  },
  async list() {
    return prisma.department.findMany({ orderBy: { name: "asc" } });
  },
  async remove(id: string) {
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) throw new AppError("Department not found", 404);
    await prisma.department.delete({ where: { id } });
  },
};