import { Router } from "express";
import { AuthController } from "@/modules/auth/auth.controller";
import { validate } from "@/middleware/validate.middleware";
import { authenticate } from "@/middleware/auth.middleware";
import { registerSchema, loginSchema, refreshSchema } from "@/modules/auth/auth.validation";
import { verifyEmailSchema, resendVerificationSchema } from "@/modules/auth/auth.validation";


const router = Router();

router.post("/verify-email", validate(verifyEmailSchema), AuthController.verifyEmail);

router.post("/resend-verification", validate(resendVerificationSchema), AuthController.resendVerification);

router.post("/register", validate(registerSchema), AuthController.register);

router.post("/login", validate(loginSchema), AuthController.login);

router.post("/refresh", validate(refreshSchema), AuthController.refresh);

router.get("/me", authenticate, AuthController.me);

router.get("/allowed-domains", AuthController.allowedDomains);

export default router;
