import { Router } from "express";
import { AuthController } from "@/modules/auth/auth.controller";
import { validate } from "@/middleware/validate.middleware";
import { authenticate } from "@/middleware/auth.middleware";
import { registerSchema, loginSchema, refreshSchema } from "@/modules/auth/auth.validation";
import { verifyEmailSchema, resendVerificationSchema } from "@/modules/auth/auth.validation";
import { authLimiter, forgotPasswordLimiter } from "@/middleware/rateLimit.middleware";

import { forgotPasswordSchema, resetPasswordSchema } from "@/modules/auth/auth.validation";

const router = Router();

router.post("/verify-email", authLimiter, validate(verifyEmailSchema), AuthController.verifyEmail);

router.post("/resend-verification", authLimiter, validate(resendVerificationSchema), AuthController.resendVerification);

router.post("/register", authLimiter, validate(registerSchema), AuthController.register);

router.post("/login", authLimiter, validate(loginSchema), AuthController.login);

router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), AuthController.resetPassword);

router.post("/refresh", validate(refreshSchema), AuthController.refresh);

router.get("/me", authenticate, AuthController.me);

router.get("/allowed-domains", AuthController.allowedDomains);

export default router;
