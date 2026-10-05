import { Router } from "express";
import { DepartmentController } from "@/modules/departments/department.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { authorize } from "@/middleware/authorize.middleware";
import { validate } from "@/middleware/validate.middleware";
import { Role } from "@prisma/client";
import { createDepartmentSchema } from "@/modules/departments/department.validation";

const router = Router();

router.use(authenticate);

router.get("/", DepartmentController.list);
router.post("/", authorize(Role.ADMIN), validate(createDepartmentSchema), DepartmentController.create);
router.delete("/:id", authorize(Role.ADMIN), DepartmentController.remove);

export default router;