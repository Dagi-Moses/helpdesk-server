import { Router } from "express";
import { UserController } from "@/modules/users/user.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { authorize } from "@/middleware/authorize.middleware";
import { validate } from "@/middleware/validate.middleware";
import { Role } from "@prisma/client";
import { createUserSchema, updateUserSchema } from "@/modules/users/user.validation";

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));
router.get("/", UserController.list);
router.post("/", validate(createUserSchema), UserController.create);
router.get("/:id", UserController.getById);
router.patch("/:id", validate(updateUserSchema), UserController.update);
router.patch("/:id/deactivate", UserController.deactivate);

router.patch("/:id/reactivate", UserController.reactivate);
router.delete("/:id", UserController.remove);

export default router;
