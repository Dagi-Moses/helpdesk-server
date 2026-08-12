import { Router } from "express";
import { CommentController } from "@/modules/comments/comment.controller";
import { validate } from "@/middleware/validate.middleware";
import { createCommentSchema } from "@/modules/comments/comment.validation";

// mergeParams lets this router read :ticketId from the parent router
const router = Router({ mergeParams: true });

/**
 * @openapi
 * /tickets/{ticketId}/comments:
 *   post:
 *     summary: Add a comment to a ticket
 *     tags: [Comments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Comment added }
 *   get:
 *     summary: List comments for a ticket
 *     tags: [Comments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Comments retrieved }
 */
router.post("/", validate(createCommentSchema), CommentController.create);
router.get("/", CommentController.list);

export default router;
