import { Router } from "express";
import { getProjects, createProject } from "../controllers/projectcontroller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/errorHandler.js";
import { createProjectSchema } from "../validation/schemas.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects with pagination
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of projects
 */
router.get("/", getProjects);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Project created
 *       400:
 *         description: Project name already exists
 */
router.post("/", validate(createProjectSchema), createProject);

export default router;
