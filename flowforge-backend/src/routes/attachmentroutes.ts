import { Router } from "express";
import {
  uploadAttachment,
  getAttachments,
  downloadAttachment,
  deleteAttachment,
} from "../controllers/attachmentcontroller.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../config/multer.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments:
 *   get:
 *     summary: Get attachments for a task
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of attachments
 */
router.get("/", getAttachments);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments:
 *   post:
 *     summary: Upload an attachment to a task
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Attachment uploaded
 */
router.post("/", upload.single("file"), uploadAttachment);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments/{attachmentId}/download:
 *   get:
 *     summary: Download an attachment
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File download
 */
router.get("/:attachmentId/download", downloadAttachment);

/**
 * @swagger
 * /api/tasks/{taskId}/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete an attachment
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attachment deleted
 */
router.delete("/:attachmentId", deleteAttachment);

export default router;
