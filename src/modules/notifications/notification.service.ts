import { prisma } from "@/config/prisma";
import { NotificationType, Role } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  ticketId?: string;
}

export const NotificationService = {
  async create(input: CreateNotificationInput) {
    return prisma.notification.create({ data: input });
  },

  async createMany(inputs: CreateNotificationInput[]) {
    if (inputs.length === 0) return;
    await prisma.notification.createMany({ data: inputs });
  },

  // Used for ticket-created events — every admin needs to know a new
  // ticket is waiting to be triaged/assigned.
  async notifyAdmins(input: Omit<CreateNotificationInput, "userId">) {
    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN, isActive: true },
      select: { id: true },
    });
    await this.createMany(admins.map((a) => ({ ...input, userId: a.id })));
  },

  async listForUser(userId: string, limit = 30) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  async markRead(userId: string, id: string) {
    // updateMany (not update) so this silently no-ops on a mismatched
    // userId instead of throwing — a user can't mark someone else's
    // notification read, and doesn't need an error telling them so.
    await prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  },

  async markReadForTicket(userId: string, ticketId: string) {
  await prisma.notification.updateMany({
    where: { userId, ticketId, isRead: false },
    data: { isRead: true },
  });
},
};