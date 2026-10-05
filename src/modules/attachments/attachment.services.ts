import fs from "fs";
import path from "path";
import { Role } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/apiResponse";
import { TicketService } from "@/modules/tickets/ticket.service";
import { UPLOAD_DIR_PATH } from "@/config/multer";

interface AuthUser {
  userId: string;
  role: Role;
}

export const AttachmentService = {
  async create(user: AuthUser, ticketId: string, files: Express.Multer.File[]) {
    const ticket = await TicketService.findOrThrow(ticketId);
    TicketService.assertCanView(user, ticket.createdById, ticket.assignedToId);

    if (!files || files.length === 0) {
      throw new AppError("No files were uploaded", 400);
    }

    const attachments = await prisma.$transaction(
      files.map((file) =>
        prisma.attachment.create({
          data: {
            ticketId,
            uploadedById: user.userId,
            fileName: file.originalname,
            fileUrl: file.filename, // stored disk filename, not a public path
            fileSize: file.size,
            mimeType: file.mimetype,
          },
        })
      )
    );

    return attachments.map(this.withDownloadUrl);
  },

  async getForDownload(user: AuthUser, attachmentId: string) {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: { select: { createdById: true, assignedToId: true } } },
    });
    if (!attachment) throw new AppError("Attachment not found", 404);

    TicketService.assertCanView(user, attachment.ticket.createdById, attachment.ticket.assignedToId);

    const filePath = path.join(UPLOAD_DIR_PATH, attachment.fileUrl);
    if (!fs.existsSync(filePath)) {
      throw new AppError("File is missing from storage", 404);
    }

    return { filePath, fileName: attachment.fileName, mimeType: attachment.mimeType };
  },

  async remove(user: AuthUser, attachmentId: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) throw new AppError("Attachment not found", 404);

    const canDelete = user.role === Role.ADMIN || attachment.uploadedById === user.userId;
    if (!canDelete) {
      throw new AppError("You can only delete attachments you uploaded", 403);
    }

    const filePath = path.join(UPLOAD_DIR_PATH, attachment.fileUrl);
    await prisma.attachment.delete({ where: { id: attachmentId } });

    // Best-effort disk cleanup — don't fail the request if this errors,
    // the DB record (the source of truth for the UI) is already gone.
    fs.unlink(filePath, () => {});
  },

  withDownloadUrl<T extends { id: string; fileUrl: string }>(attachment: T) {
    const { fileUrl: _internal, ...rest } = attachment;
    return { ...rest, downloadUrl: `/attachments/${attachment.id}/download` };
  },
};