import { Request, Response } from "express";
import { TicketService } from "@/modules/tickets/ticket.service";
import { ApiResponse } from "@/utils/apiResponse";

export const TicketController = {
  async create(req: Request, res: Response) {
    const ticket = await TicketService.create(req.user!, req.body);
    return ApiResponse.created(res, ticket, "Ticket created");
  },

  async list(req: Request, res: Response) {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "20", 10);

    const { tickets, total } = await TicketService.list(req.user!, {
      status: req.query.status as never,
      priority: req.query.priority as never,
      categoryId: req.query.categoryId as string | undefined,
      page,
      limit,
    });

    return ApiResponse.success(res, tickets, "Tickets retrieved", 200, { page, limit, total });
  },

  async getById(req: Request, res: Response) {
    const ticket = await TicketService.getById(req.user!, req.params.id);
    return ApiResponse.success(res, ticket, "Ticket retrieved");
  },

  async update(req: Request, res: Response) {
    const ticket = await TicketService.update(req.user!, req.params.id, req.body);
    return ApiResponse.success(res, ticket, "Ticket updated");
  },

  async assign(req: Request, res: Response) {
    const ticket = await TicketService.assign(req.user!, req.params.id, req.body.assignedToId);
    return ApiResponse.success(res, ticket, "Ticket assigned");
  },

  async updateStatus(req: Request, res: Response) {
    const ticket = await TicketService.updateStatus(req.user!, req.params.id, req.body.status);
    return ApiResponse.success(res, ticket, "Ticket status updated");
  },

  async dashboardStats(req: Request, res: Response) {
    const stats = await TicketService.dashboardStats(req.user!);
    return ApiResponse.success(res, stats, "Dashboard stats retrieved");
  },
};
