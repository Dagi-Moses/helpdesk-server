import { Router } from "express";
import { AttachmentController } from "@/modules/attachments/attachment.controller";
import { authenticate } from "@/middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.get("/:id/download", AttachmentController.download);
router.delete("/:id", AttachmentController.remove);

export default router;