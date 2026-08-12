import { Role } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/apiResponse";
import { TicketService } from "@/modules/tickets/ticket.service";

interface AuthUser {
  userId: string;
  role: Role;
}

export const CommentService = {
  async create(user: AuthUser, ticketId: string, body: string, isInternal = false) {
    const ticket = await TicketService.findOrThrow(ticketId);
    TicketService.assertCanView(user, ticket.createdById, ticket.assignedToId);

    // Only agents/admins may post internal-only notes.
    if (isInternal && user.role === Role.EMPLOYEE) {
      throw new AppError("Employees cannot create internal notes", 403);
    }

    return prisma.comment.create({
      data: {
        ticketId,
        authorId: user.userId,
        body,
        isInternal: user.role === Role.EMPLOYEE ? false : isInternal,
      },
      include: { author: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });
  },

  async listForTicket(user: AuthUser, ticketId: string) {
    const ticket = await TicketService.findOrThrow(ticketId);
    TicketService.assertCanView(user, ticket.createdById, ticket.assignedToId);

    const comments = await prisma.comment.findMany({
      where: {
        ticketId,
        ...(user.role === Role.EMPLOYEE ? { isInternal: false } : {}),
      },
      include: { author: { select: { id: true, firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });
    return comments;
  },
};
