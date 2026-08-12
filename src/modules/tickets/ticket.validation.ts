import { z } from "zod";
import { Priority, TicketStatus } from "@prisma/client";

export const createTicketSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    categoryId: z.string().uuid().optional(),
    priority: z.nativeEnum(Priority).optional(),
  }),
});

export const updateTicketStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(TicketStatus),
  }),
});

export const assignTicketSchema = z.object({
  body: z.object({
    assignedToId: z.string().uuid("A valid agent id is required"),
  }),
});

export const updateTicketSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    categoryId: z.string().uuid().optional(),
    priority: z.nativeEnum(Priority).optional(),
  }),
});

export const listTicketsQuerySchema = z.object({
  query: z.object({
    status: z.nativeEnum(TicketStatus).optional(),
    priority: z.nativeEnum(Priority).optional(),
    categoryId: z.string().uuid().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});
