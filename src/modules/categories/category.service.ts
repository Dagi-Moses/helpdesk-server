import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/apiResponse";

export const CategoryService = {
  async create(name: string, description?: string) {
    return prisma.category.create({ data: { name, description } });
  },

  async list() {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  },

  async update(id: string, data: { name?: string; description?: string }) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new AppError("Category not found", 404);
    return prisma.category.update({ where: { id }, data });
  },

  async remove(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new AppError("Category not found", 404);
    await prisma.category.delete({ where: { id } });
  },
};
