import { Router } from "express";
import { TicketController } from "@/modules/tickets/ticket.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { authorize } from "@/middleware/authorize.middleware";
import { validate } from "@/middleware/validate.middleware";
import { Role } from "@prisma/client";
import attachmentRoutes from "@/modules/attachments/attachment.routes";
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

router.post("/", validate(createTicketSchema), TicketController.create);
router.get("/", validate(listTicketsQuerySchema), TicketController.list);

router.get("/dashboard/stats", TicketController.dashboardStats);

router.get("/:id", TicketController.getById);
router.patch("/:id", validate(updateTicketSchema), TicketController.update);



router.patch(
  "/:id/assign",
  authorize(Role.ADMIN),
  validate(assignTicketSchema),
  TicketController.assign
);

router.patch(
  "/:id/status",
  authorize(Role.SUPPORT_AGENT, Role.ADMIN),
  validate(updateTicketStatusSchema),
  TicketController.updateStatus
);

// Nested comment routes: /tickets/:ticketId/comments
router.use("/:ticketId/comments", commentRoutes);
router.use("/:ticketId/attachments", attachmentRoutes);

export default router;
