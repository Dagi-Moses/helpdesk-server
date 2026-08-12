import { Request, Response } from "express";
import { CommentService } from "@/modules/comments/comment.service";
import { ApiResponse } from "@/utils/apiResponse";

export const CommentController = {
  async create(req: Request, res: Response) {
    const comment = await CommentService.create(
      req.user!,
      req.params.ticketId,
      req.body.body,
      req.body.isInternal
    );
    return ApiResponse.created(res, comment, "Comment added");
  },

  async list(req: Request, res: Response) {
    const comments = await CommentService.listForTicket(req.user!, req.params.ticketId);
    return ApiResponse.success(res, comments, "Comments retrieved");
  },
};
