import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/apiResponse";

const SALT_ROUNDS = 12;

function sanitize<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _omit, ...safe } = user;
  return safe;
}

export const UserService = {
  async create(input: { email: string; password: string; firstName: string; lastName: string; role: Role; departmentId?: string }) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError("A user with this email already exists", 409);

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { ...input, passwordHash },
    });
    return sanitize(user);
  },

  async list(filters: { role?: Role }) {
    const users = await prisma.user.findMany({
      where: filters.role ? { role: filters.role } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return users.map(sanitize);
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError("User not found", 404);
    return sanitize(user);
  },

  async update(id: string, data: Partial<{ firstName: string; lastName: string; role: Role; departmentId: string; isActive: boolean }>) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError("User not found", 404);
    const updated = await prisma.user.update({ where: { id }, data });
    return sanitize(updated);
  },

  async deactivate(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError("User not found", 404);
    const updated = await prisma.user.update({ where: { id }, data: { isActive: false } });
    return sanitize(updated);
  },
};
