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

    const { password, ...rest } = input;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { ...rest, passwordHash, isEmailVerified: true },
    });
    return sanitize(user);
  },

  async list(filters: { role?: Role }) {
    const users = await prisma.user.findMany({
      where: filters.role ? { role: filters.role } : undefined,
      include: { department: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return users.map(sanitize);
  },

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { department: { select: { id: true, name: true } } },
    });
    if (!user) throw new AppError("User not found", 404);
    return sanitize(user);
  },

  async update(
    id: string,
    data: Partial<{ firstName: string; lastName: string; role: Role; departmentId: string | null }>
  ) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError("User not found", 404);

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: { department: { select: { id: true, name: true } } },
    });
    return sanitize(updated);
  },

  async deactivate(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new AppError("You cannot deactivate your own account", 400);
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError("User not found", 404);

    await this.assertNotLastActiveAdmin(user);

    const updated = await prisma.user.update({ where: { id }, data: { isActive: false } });
    return sanitize(updated);
  },

  async reactivate(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new AppError("You cannot modify your own account status", 400);
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError("User not found", 404);

    const updated = await prisma.user.update({ where: { id }, data: { isActive: true } });
    return sanitize(updated);
  },

  // Hard delete — only permitted when the account has no associated
  // ticket history. Deleting a user with tickets/comments/history would
  // either hit a foreign-key constraint or silently orphan records, so
  // we block it and steer toward deactivation instead, which preserves
  // the audit trail while removing the account's ability to log in.
  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new AppError("You cannot delete your own account", 400);
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError("User not found", 404);

    await this.assertNotLastActiveAdmin(user);

    const [ticketsCreated, ticketsAssigned, comments, history, attachments] = await Promise.all([
      prisma.ticket.count({ where: { createdById: id } }),
      prisma.ticket.count({ where: { assignedToId: id } }),
      prisma.comment.count({ where: { authorId: id } }),
      prisma.ticketHistory.count({ where: { userId: id } }),
      prisma.attachment.count({ where: { uploadedById: id } }),
    ]);

    const hasHistory = ticketsCreated + ticketsAssigned + comments + history + attachments > 0;
    if (hasHistory) {
      throw new AppError(
        "This user has ticket history and can't be permanently deleted. Deactivate the account instead to preserve records.",
        409
      );
    }

    await prisma.user.delete({ where: { id } });
  },

  async assertNotLastActiveAdmin(user: { role: Role; isActive: boolean }) {
    if (user.role !== Role.ADMIN || !user.isActive) return;
    const activeAdminCount = await prisma.user.count({ where: { role: Role.ADMIN, isActive: true } });
    if (activeAdminCount <= 1) {
      throw new AppError("Can't deactivate or delete the last active admin account", 400);
    }
  },
};





// import bcrypt from "bcrypt";
// import { Role } from "@prisma/client";
// import { prisma } from "@/config/prisma";
// import { AppError } from "@/utils/apiResponse";

// const SALT_ROUNDS = 12;

// function sanitize<T extends { passwordHash: string }>(user: T) {
//   const { passwordHash: _omit, ...safe } = user;
//   return safe;
// }

// export const UserService = {
//   async create(input: { email: string; password: string; firstName: string; lastName: string; role: Role; departmentId?: string }) {
//     const existing = await prisma.user.findUnique({ where: { email: input.email } });
//     if (existing) throw new AppError("A user with this email already exists", 409);

//     const { password, ...rest } = input;
//     const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
//     const user = await prisma.user.create({
//       data: { ...rest, passwordHash , isEmailVerified: true },
//     });
//     return sanitize(user);



//   },

//   async list(filters: { role?: Role }) {
//     const users = await prisma.user.findMany({
//       where: filters.role ? { role: filters.role } : undefined,
//       orderBy: { createdAt: "desc" },
//     });
//     return users.map(sanitize);
//   },

//   async getById(id: string) {
//     const user = await prisma.user.findUnique({ where: { id } });
//     if (!user) throw new AppError("User not found", 404);
//     return sanitize(user);
//   },

//   async update(id: string, data: Partial<{ firstName: string; lastName: string; role: Role; departmentId: string; isActive: boolean }>) {
//     const user = await prisma.user.findUnique({ where: { id } });
//     if (!user) throw new AppError("User not found", 404);
//     const updated = await prisma.user.update({ where: { id }, data });
//     return sanitize(updated);
//   },

//   async deactivate(id: string) {
//     const user = await prisma.user.findUnique({ where: { id } });
//     if (!user) throw new AppError("User not found", 404);
//     const updated = await prisma.user.update({ where: { id }, data: { isActive: false } });
//     return sanitize(updated);
//   },
// };
