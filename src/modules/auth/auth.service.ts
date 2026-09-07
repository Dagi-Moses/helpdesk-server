import bcrypt from "bcrypt";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/apiResponse";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/utils/jwt";
import { Role } from "@prisma/client";
import crypto from "crypto";
import { sendMail, verificationEmail,resetPasswordEmail,  } from "@/utils/mailer";


const SALT_ROUNDS = 12;

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  departmentId?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

function sanitizeUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _omit, ...safe } = user;
  return safe;
}

function generateVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return { rawToken, tokenHash, expires };
}

function checkAllowedDomain(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
    throw new AppError(`Registration is restricted to ${allowedDomains.join(", ")} email addresses`, 403);
  }
}

export const AuthService = {

  async register(input: RegisterInput) {
  checkAllowedDomain(input.email);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const { rawToken, tokenHash, expires } = generateVerificationToken();

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: Role.EMPLOYEE,
      departmentId: input.departmentId,
      emailVerificationToken: tokenHash,
      emailVerificationExpires: expires,
    },
  });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
  await sendMail(user.email, "Verify your email", verificationEmail(user.firstName, verifyUrl));

  // Deliberately no tokens returned — the account isn't usable until verified.
  return { message: "Account created. Check your email to verify your address before signing in." };
},
  // async register(input: RegisterInput) {
  //   const existing = await prisma.user.findUnique({ where: { email: input.email } });
  //   if (existing) {
  //     throw new AppError("An account with this email already exists", 409);
  //   }

  //   const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  //   // New self-registrations are always EMPLOYEE. Agents/Admins are
  //   // provisioned by an admin via the users module, never self-assigned.
  //   const user = await prisma.user.create({
  //     data: {
  //       email: input.email,
  //       passwordHash,
  //       firstName: input.firstName,
  //       lastName: input.lastName,
  //       role: Role.EMPLOYEE,
  //       departmentId: input.departmentId,
  //     },
  //   });

  //   const tokens = this.issueTokens(user.id, user.role, user.email);
  //   return { user: sanitizeUser(user), ...tokens };
  // },

  async login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.isActive) {
    throw new AppError("Invalid email or password", 401);
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isEmailVerified) {
    throw new AppError("Please verify your email before signing in — check your inbox for the link.", 403, undefined,
"EMAIL_NOT_VERIFIED");
  }

  const tokens = this.issueTokens(user.id, user.role, user.email);
  return { user: sanitizeUser(user), ...tokens };
},
  // async login(input: LoginInput) {
  //   const user = await prisma.user.findUnique({ where: { email: input.email } });
  //   if (!user || !user.isActive) {
  //     throw new AppError("Invalid email or password", 401);
  //   }

  //   const isValid = await bcrypt.compare(input.password, user.passwordHash);
  //   if (!isValid) {
  //     throw new AppError("Invalid email or password", 401);
  //   }

  //   const tokens = this.issueTokens(user.id, user.role, user.email);
  //   return { user: sanitizeUser(user), ...tokens };
  // },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      throw new AppError("User no longer exists or is inactive", 401);
    }

    return this.issueTokens(user.id, user.role, user.email);
  },

  issueTokens(userId: string, role: Role, email: string) {
    const payload = { userId, role, email };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  },

  async allowedDomains() {
    const domains = (process.env.ALLOWED_EMAIL_DOMAINS || "")
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
    return { allowedDomains: domains };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);
    return sanitizeUser(user);
  },
  async verifyEmail(rawToken: string) {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: tokenHash, emailVerificationExpires: { gt: new Date() } },
  });

  if (!user) {
    throw new AppError("This verification link is invalid or has expired", 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, emailVerificationToken: null, emailVerificationExpires: null },
  });

  return { message: "Email verified — you can now sign in." };
},

async resendVerification(email: string) {
  
    const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Don't reveal whether the account exists either way.
  if (!user || user.isEmailVerified) {
    return { message: "If an account exists and is unverified, a new link has been sent." };
  }

  const { rawToken, tokenHash, expires } = generateVerificationToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerificationToken: tokenHash, emailVerificationExpires: expires },
  });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
  await sendMail(user.email, "Verify your email", verificationEmail(user.firstName, verifyUrl));

  return { message: "If an account exists and is unverified, a new link has been sent." };
},

async forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Same response either way — don't reveal whether the account exists.
  if (!user || !user.isActive) {
    return { message: "If an account exists with that email, a reset link has been sent." };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordToken: tokenHash, resetPasswordExpires: expires },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
  await sendMail(user.email, "Reset your password", resetPasswordEmail(user.firstName, resetUrl));

  return { message: "If an account exists with that email, a reset link has been sent." };
},

async resetPassword(rawToken: string, newPassword: string) {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const user = await prisma.user.findFirst({
    where: { resetPasswordToken: tokenHash, resetPasswordExpires: { gt: new Date() } },
  });

  if (!user) {
    throw new AppError("This reset link is invalid or has expired", 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetPasswordToken: null, resetPasswordExpires: null },
  });

  return { message: "Password reset — you can now sign in with your new password." };
},
};
