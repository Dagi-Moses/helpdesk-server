import bcrypt from "bcrypt";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/apiResponse";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/utils/jwt";
import { Role } from "@prisma/client";

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

export const AuthService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new AppError("An account with this email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // New self-registrations are always EMPLOYEE. Agents/Admins are
    // provisioned by an admin via the users module, never self-assigned.
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: Role.EMPLOYEE,
        departmentId: input.departmentId,
      },
    });

    const tokens = this.issueTokens(user.id, user.role, user.email);
    return { user: sanitizeUser(user), ...tokens };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) {
      throw new AppError("Invalid email or password", 401);
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const tokens = this.issueTokens(user.id, user.role, user.email);
    return { user: sanitizeUser(user), ...tokens };
  },

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

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);
    return sanitizeUser(user);
  },
};
