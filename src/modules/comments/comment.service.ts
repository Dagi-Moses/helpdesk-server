import { Role } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/apiResponse";
import { TicketService } from "@/modules/tickets/ticket.service";
import { sendMail, ticketCommentEmail } from "@/utils/mailer";
import { logger } from "@/utils/logger";
import { NotificationService } from "@/modules/notifications/notification.service";

interface AuthUser {
  userId: string;
  role: Role;
}

export const CommentService = {
  async create(user: AuthUser, ticketId: string, body: string, isInternal = false) {
    const ticket = await TicketService.findOrThrow(ticketId);
    TicketService.assertCanView(user, ticket.createdById, ticket.assignedToId);

    if (isInternal && user.role === Role.EMPLOYEE) {
      throw new AppError("Employees cannot create internal notes", 403);
    }

    const comment = await prisma.comment.create({
      data: {
        ticketId,
        authorId: user.userId,
        body,
        isInternal: user.role === Role.EMPLOYEE ? false : isInternal,
      },
      include: { author: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });

    // Internal notes never notify the employee — that's the whole point of them.
    if (!comment.isInternal) {
      this.notifyOtherParty(user, ticket, comment.author).catch((err) =>
        logger.error("Failed to send comment notification", err)
      );
    }

    return comment;
  },

  async notifyOtherParty(
    commenter: AuthUser,
    ticket: { id: string; title: string; createdById: string; assignedToId: string | null },
    author: { firstName: string; lastName: string }
  ) {
    const ticketUrl = `${process.env.FRONTEND_URL}/tickets/${ticket.id}`;
    const commenterName = `${author.firstName} ${author.lastName}`;


  const recipientId =
    commenter.userId === ticket.createdById ? ticket.assignedToId : ticket.createdById;

  if (recipientId) {
    NotificationService.create({
      userId: recipientId,
      type: "TICKET_COMMENTED",
      title: `${commenterName} commented`,
      message: ticket.title,
      ticketId: ticket.id,
    }).catch((err) => logger.error("Failed to create comment notification", err));
  }
    // Employee commented → notify the assigned agent (if any).
    if (commenter.userId === ticket.createdById && ticket.assignedToId) {
      const agent = await prisma.user.findUnique({ where: { id: ticket.assignedToId } });
      if (agent) {
        await sendMail(agent.email, "New comment on a ticket", ticketCommentEmail(agent.firstName, commenterName, ticket.title, ticketUrl));
      }
      return;
    }

    // Agent/admin commented → notify the employee who filed it.
    if (commenter.userId !== ticket.createdById) {
      const employee = await prisma.user.findUnique({ where: { id: ticket.createdById } });
      if (employee) {
        await sendMail(employee.email, "New comment on your ticket", ticketCommentEmail(employee.firstName, commenterName, ticket.title, ticketUrl));
      }
    }
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
