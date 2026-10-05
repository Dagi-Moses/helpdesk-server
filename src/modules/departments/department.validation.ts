import { z } from "zod";

export const createDepartmentSchema = z.object({
  body: z.object({ name: z.string().min(2, "Name must be at least 2 characters") }),
});