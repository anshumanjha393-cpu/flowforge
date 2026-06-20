import { Router } from "express";
import { submitSupportTicket, submitBugReport } from "../controllers/supportcontroller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/support/ticket:
 *   post:
 *     summary: Submit a support ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket created successfully
 */
router.post("/ticket", submitSupportTicket);

/**
 * @swagger
 * /api/support/bug:
 *   post:
 *     summary: Submit a bug report
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - steps
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               steps:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Bug report created successfully
 */
router.post("/bug", submitBugReport);

export default router;
