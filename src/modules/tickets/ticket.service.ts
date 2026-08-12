import { Prisma, Priority, Role, TicketStatus } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/apiResponse";

interface AuthUser {
  userId: string;
  role: Role;
}

interface CreateTicketInput {
  title: string;
  description: string;
  categoryId?: string;
  priority?: Priority;
}

interface ListFilters {
  status?: TicketStatus;
  priority?: Priority;
  categoryId?: string;
  page: number;
  limit: number;
}

// Legal status transitions. Prevents e.g. jumping straight from OPEN to CLOSED
// or reopening a CLOSED ticket without going through the proper flow.
const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["ASSIGNED", "IN_PROGRESS"],
  ASSIGNED: ["IN_PROGRESS", "OPEN"],
  IN_PROGRESS: ["WAITING_FOR_USER", "RESOLVED", "ASSIGNED"],
  WAITING_FOR_USER: ["IN_PROGRESS", "RESOLVED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"], // reopen if user disputes resolution
  CLOSED: [],
};

const ticketWithRelations = {
  category: true,
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.TicketInclude;

export const TicketService = {
  async create(user: AuthUser, input: CreateTicketInput) {
    const ticket = await prisma.ticket.create({
      data: {
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        priority: input.priority ?? Priority.MEDIUM,
        createdById: user.userId,
      },
      include: ticketWithRelations,
    });
    return ticket;
  },

  async list(user: AuthUser, filters: ListFilters) {
    const where: Prisma.TicketWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    };

    // Role-based visibility: employees only see their own tickets,
    // agents see tickets assigned to them, admins see everything.
    if (user.role === Role.EMPLOYEE) {
      where.createdById = user.userId;
    } else if (user.role === Role.SUPPORT_AGENT) {
      where.assignedToId = user.userId;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: ticketWithRelations,
        orderBy: { createdAt: "desc" },
        skip,
        take: filters.limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return { tickets, total };
  },

  async getById(user: AuthUser, ticketId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        ...ticketWithRelations,
        comments: {
          include: { author: { select: { id: true, firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
        history: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
        },
        attachments: true,
      },
    });

    if (!ticket) throw new AppError("Ticket not found", 404);

    this.assertCanView(user, ticket.createdById, ticket.assignedToId);

    // Employees should not see internal-only comments.
    if (user.role === Role.EMPLOYEE) {
      ticket.comments = ticket.comments.filter((c) => !c.isInternal);
    }

    return ticket;
  },

  async update(user: AuthUser, ticketId: string, input: Partial<CreateTicketInput>) {
    const ticket = await this.findOrThrow(ticketId);

    // Only the original creator (if still open) or an admin may edit ticket details.
    if (user.role === Role.EMPLOYEE && ticket.createdById !== user.userId) {
      throw new AppError("You do not have permission to edit this ticket", 403);
    }
    if (user.role === Role.EMPLOYEE && ticket.status !== TicketStatus.OPEN) {
      throw new AppError("Ticket can only be edited while still OPEN", 400);
    }

    return prisma.ticket.update({
      where: { id: ticketId },
      data: input,
      include: ticketWithRelations,
    });
  },

  async assign(user: AuthUser, ticketId: string, assignedToId: string) {
    if (user.role !== Role.ADMIN) {
      throw new AppError("Only an admin can assign tickets", 403);
    }

    const ticket = await this.findOrThrow(ticketId);

    const agent = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!agent || agent.role !== Role.SUPPORT_AGENT) {
      throw new AppError("assignedToId must reference an active support agent", 400);
    }

    const [updated] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: ticketId },
        data: {
          assignedToId,
          status: ticket.status === TicketStatus.OPEN ? TicketStatus.ASSIGNED : ticket.status,
        },
        include: ticketWithRelations,
      }),
      prisma.ticketHistory.create({
        data: {
          ticketId,
          userId: user.userId,
          field: "assignedTo",
          oldValue: ticket.assignedToId ?? "unassigned",
          newValue: assignedToId,
        },
      }),
    ]);

    return updated;
  },

  async updateStatus(user: AuthUser, ticketId: string, newStatus: TicketStatus) {
    const ticket = await this.findOrThrow(ticketId);

    if (user.role === Role.EMPLOYEE) {
      throw new AppError("Employees cannot change ticket status directly", 403);
    }
    if (user.role === Role.SUPPORT_AGENT && ticket.assignedToId !== user.userId) {
      throw new AppError("You can only update tickets assigned to you", 403);
    }

    const allowed = ALLOWED_TRANSITIONS[ticket.status];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition ticket from ${ticket.status} to ${newStatus}`,
        400
      );
    }

    const extraFields: Prisma.TicketUpdateInput = {};
    if (newStatus === TicketStatus.RESOLVED) extraFields.resolvedAt = new Date();
    if (newStatus === TicketStatus.CLOSED) extraFields.closedAt = new Date();

    const [updated] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: ticketId },
        data: { status: newStatus, ...extraFields },
        include: ticketWithRelations,
      }),
      prisma.ticketHistory.create({
        data: {
          ticketId,
          userId: user.userId,
          field: "status",
          oldValue: ticket.status,
          newValue: newStatus,
        },
      }),
    ]);

    return updated;
  },

  async findOrThrow(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new AppError("Ticket not found", 404);
    return ticket;
  },

  assertCanView(user: AuthUser, createdById: string, assignedToId: string | null) {
    if (user.role === Role.ADMIN) return;
    if (user.role === Role.EMPLOYEE && createdById === user.userId) return;
    if (user.role === Role.SUPPORT_AGENT && assignedToId === user.userId) return;
    throw new AppError("You do not have permission to view this ticket", 403);
  },

  // Aggregate stats used by role-specific dashboards
  async dashboardStats(user: AuthUser) {
    if (user.role === Role.EMPLOYEE) {
      const [total, open, resolved] = await Promise.all([
        prisma.ticket.count({ where: { createdById: user.userId } }),
        prisma.ticket.count({ where: { createdById: user.userId, status: TicketStatus.OPEN } }),
        prisma.ticket.count({
          where: { createdById: user.userId, status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] } },
        }),
      ]);
      return { total, open, resolved };
    }

    if (user.role === Role.SUPPORT_AGENT) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [assigned, critical, pending, completedToday] = await Promise.all([
        prisma.ticket.count({ where: { assignedToId: user.userId } }),
        prisma.ticket.count({ where: { assignedToId: user.userId, priority: Priority.CRITICAL } }),
        prisma.ticket.count({
          where: {
            assignedToId: user.userId,
            status: { in: [TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_USER] },
          },
        }),
        prisma.ticket.count({
          where: { assignedToId: user.userId, status: TicketStatus.RESOLVED, resolvedAt: { gte: startOfDay } },
        }),
      ]);
      return { assigned, critical, pending, completedToday };
    }

    // ADMIN: system-wide overview
    const [total, open, resolved, closed] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: TicketStatus.OPEN } }),
      prisma.ticket.count({ where: { status: TicketStatus.RESOLVED } }),
      prisma.ticket.count({ where: { status: TicketStatus.CLOSED } }),
    ]);
    return { total, open, resolved, closed };
  },
};
