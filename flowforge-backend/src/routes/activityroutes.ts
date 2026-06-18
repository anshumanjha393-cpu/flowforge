import { Router } from "express";
import { getActivities } from "../controllers/activitycontroller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Get recent activities with pagination
 *     tags: [Activities]
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
 *     responses:
 *       200:
 *         description: Paginated list of activities
 */
router.get("/", getActivities);

export default router;
