import { Request, Response } from "express";
import { AttachmentService } from "@/modules/attachments/attachment.services";
import { ApiResponse } from "@/utils/apiResponse";

export const AttachmentController = {
  async upload(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[];
    const attachments = await AttachmentService.create(req.user!, req.params.ticketId, files);
    return ApiResponse.created(res, attachments, "Files uploaded");
  },

  async download(req: Request, res: Response) {
    const { filePath, fileName, mimeType } = await AttachmentService.getForDownload(req.user!, req.params.id);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.sendFile(filePath);
  },

  async remove(req: Request, res: Response) {
    await AttachmentService.remove(req.user!, req.params.id);
    return ApiResponse.noContent(res);
  },
};