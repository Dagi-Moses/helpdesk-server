import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { AppError } from "@/utils/apiResponse";

/**
 * Validates req.body/query/params against a Zod schema shaped like:
 * z.object({ body: z.object({...}), query: z.object({...}), params: z.object({...}) })
 * Only the sections present in the schema need to be included.
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body ?? req.body;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        }));
        throw new AppError("Validation failed", 422, details);
      }
      next(err);
    }
  };
}
