import { Request, Response } from "express";
import { NotificationService } from "@/modules/notifications/notification.service";
import { ApiResponse } from "@/utils/apiResponse";

export const NotificationController = {
  async list(req: Request, res: Response) {
    const notifications = await NotificationService.listForUser(req.user!.userId);
    return ApiResponse.success(res, notifications, "Notifications retrieved");
  },

  async unreadCount(req: Request, res: Response) {
    const count = await NotificationService.unreadCount(req.user!.userId);
    return ApiResponse.success(res, { count }, "Unread count retrieved");
  },

  async markRead(req: Request, res: Response) {
    await NotificationService.markRead(req.user!.userId, req.params.id);
    return ApiResponse.noContent(res);
  },

  async markAllRead(req: Request, res: Response) {
    await NotificationService.markAllRead(req.user!.userId);
    return ApiResponse.noContent(res);
  },
  async markReadForTicket(req: Request, res: Response) {
  await NotificationService.markReadForTicket(req.user!.userId, req.params.ticketId);
  return ApiResponse.noContent(res);
},
};

