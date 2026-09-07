import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again in 15 minutes." },
});


export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again in 15 minutes." },
});