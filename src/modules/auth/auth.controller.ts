import { Request, Response } from "express";
import { AuthService } from "@/modules/auth/auth.service";
import { ApiResponse } from "@/utils/apiResponse";

export const AuthController = {

  async register(req: Request, res: Response) {
  const result = await AuthService.register(req.body);
  return ApiResponse.created(res, result, result.message);
},

async verifyEmail(req: Request, res: Response) {
  const result = await AuthService.verifyEmail(req.body.token);
  return ApiResponse.success(res, result, result.message);
},

async resendVerification(req: Request, res: Response) {
  const result = await AuthService.resendVerification(req.body.email);
  return ApiResponse.success(res, result, result.message);
},
  // async register(req: Request, res: Response) {
  //   const result = await AuthService.register(req.body);
  //   return ApiResponse.created(res, result, "Account created successfully");
  // },

  async login(req: Request, res: Response) {
    const result = await AuthService.login(req.body);
    return ApiResponse.success(res, result, "Login successful");
  },

  async refresh(req: Request, res: Response) {
    const result = await AuthService.refresh(req.body.refreshToken);
    return ApiResponse.success(res, result, "Token refreshed");
  },

  async me(req: Request, res: Response) {
    const result = await AuthService.me(req.user!.userId);
    return ApiResponse.success(res, result, "Current user retrieved");
  },

   async allowedDomains(res: Response) {
    const result = await AuthService.allowedDomains();
    return ApiResponse.success(res, result, "Allowed email domains retrieved");
    
  },
  
};

