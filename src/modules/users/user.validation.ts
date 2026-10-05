import { z } from "zod";
import { Role } from "@prisma/client";

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.nativeEnum(Role),
    departmentId: z.string().uuid().optional(),
    
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    role: z.nativeEnum(Role).optional(),
    // departmentId: z.string().uuid().optional(),
    departmentId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});



