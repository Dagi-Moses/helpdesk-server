import { Router } from "express";
import { TicketController } from "@/modules/tickets/ticket.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { authorize } from "@/middleware/authorize.middleware";
import { validate } from "@/middleware/validate.middleware";
import { Role } from "@prisma/client";
import {
  createTicketSchema,
  updateTicketSchema,
  updateTicketStatusSchema,
  assignTicketSchema,
  listTicketsQuerySchema,
} from "@/modules/tickets/ticket.validation";
import commentRoutes from "@/modules/comments/comment.routes";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /tickets:
 *   post:
 *     summary: Create a new ticket
 *     tags: [Tickets]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Ticket created }
 *   get:
 *     summary: List tickets (scoped to role)
 *     tags: [Tickets]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Tickets retrieved }
 */
router.post("/", validate(createTicketSchema), TicketController.create);
router.get("/", validate(listTicketsQuerySchema), TicketController.list);

/**
 * @openapi
 * /tickets/dashboard/stats:
 *   get:
 *     summary: Get role-specific dashboard statistics
 *     tags: [Tickets]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dashboard stats }
 */
router.get("/dashboard/stats", TicketController.dashboardStats);

/**
 * @openapi
 * /tickets/{id}:
 *   get:
 *     summary: Get a ticket by id
 *     tags: [Tickets]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Ticket retrieved }
 *       404: { description: Ticket not found }
 *   patch:
 *     summary: Update ticket details
 *     tags: [Tickets]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Ticket updated }
 */
router.get("/:id", TicketController.getById);
router.patch("/:id", validate(updateTicketSchema), TicketController.update);

/**
 * @openapi
 * /tickets/{id}/assign:
 *   patch:
 *     summary: Assign a ticket to a support agent (admin only)
 *     tags: [Tickets]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Ticket assigned }
 *       403: { description: Forbidden }
 */
router.patch(
  "/:id/assign",
  authorize(Role.ADMIN),
  validate(assignTicketSchema),
  TicketController.assign
);

/**
 * @openapi
 * /tickets/{id}/status:
 *   patch:
 *     summary: Update ticket status (agents/admins only)
 *     tags: [Tickets]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Ticket status updated }
 *       400: { description: Illegal status transition }
 */
router.patch(
  "/:id/status",
  authorize(Role.SUPPORT_AGENT, Role.ADMIN),
  validate(updateTicketStatusSchema),
  TicketController.updateStatus
);

// Nested comment routes: /tickets/:ticketId/comments
router.use("/:ticketId/comments", commentRoutes);

export default router;
