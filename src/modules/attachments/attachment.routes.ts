import { Router } from "express";
import { AttachmentController } from "@/modules/attachments/attachment.controller";
import { upload } from "@/config/multer";

const router = Router({ mergeParams: true });


router.post("/", upload.array("files", 5), AttachmentController.upload);

export default router;