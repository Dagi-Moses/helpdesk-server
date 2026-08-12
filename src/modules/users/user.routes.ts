import { Router } from "express";
import { UserController } from "@/modules/users/user.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { authorize } from "@/middleware/authorize.middleware";
import { validate } from "@/middleware/validate.middleware";
import { Role } from "@prisma/client";
import { createUserSchema, updateUserSchema } from "@/modules/users/user.validation";

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Users retrieved }
 *   post:
 *     summary: Create a user with a specific role, e.g. SUPPORT_AGENT (admin only)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: User created }
 */
router.get("/", UserController.list);
router.post("/", validate(createUserSchema), UserController.create);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get a user by id (admin only)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User retrieved }
 *   patch:
 *     summary: Update a user (admin only)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User updated }
 */
router.get("/:id", UserController.getById);
router.patch("/:id", validate(updateUserSchema), UserController.update);

/**
 * @openapi
 * /users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a user (admin only)
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User deactivated }
 */
router.patch("/:id/deactivate", UserController.deactivate);

export default router;
