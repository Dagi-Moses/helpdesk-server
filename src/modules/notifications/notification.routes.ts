import { Router } from "express";
import { NotificationController } from "@/modules/notifications/notification.controller";
import { authenticate } from "@/middleware/auth.middleware";

const router = Router();
router.use(authenticate);

router.get("/", NotificationController.list);
router.get("/unread-count", NotificationController.unreadCount);
router.patch("/:id/read", NotificationController.markRead);
router.patch("/read-all", NotificationController.markAllRead);
router.patch("/ticket/:ticketId/read", NotificationController.markReadForTicket);

export default router;