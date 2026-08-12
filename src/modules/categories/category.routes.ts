import { Router } from "express";
import { CategoryController } from "@/modules/categories/category.controller";
import { authenticate } from "@/middleware/auth.middleware";
import { authorize } from "@/middleware/authorize.middleware";
import { validate } from "@/middleware/validate.middleware";
import { Role } from "@prisma/client";
import { createCategorySchema, updateCategorySchema } from "@/modules/categories/category.validation";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: List all categories
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Categories retrieved }
 *   post:
 *     summary: Create a category (admin only)
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Category created }
 */
router.get("/", CategoryController.list);
router.post("/", authorize(Role.ADMIN), validate(createCategorySchema), CategoryController.create);

/**
 * @openapi
 * /categories/{id}:
 *   patch:
 *     summary: Update a category (admin only)
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Category updated }
 *   delete:
 *     summary: Delete a category (admin only)
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       204: { description: Category deleted }
 */
router.patch("/:id", authorize(Role.ADMIN), validate(updateCategorySchema), CategoryController.update);
router.delete("/:id", authorize(Role.ADMIN), CategoryController.remove);

export default router;
