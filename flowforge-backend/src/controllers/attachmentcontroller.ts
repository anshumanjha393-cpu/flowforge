import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.resolve("uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const uploadAttachment = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;
    const userId = req.user!.userId;

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      // Remove uploaded file if task doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Task not found" });
    }

    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        userId,
        taskId,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    const userEmail = req.user?.email || "unknown@flowforge.com";
    const userName = userEmail.split("@")[0] || "unknown";
    const capitalizedUser = userName.charAt(0).toUpperCase() + userName.slice(1);

    await prisma.activity.create({
      data: {
        userId,
        userEmail,
        action: "UPLOADED",
        details: `${capitalizedUser} uploaded "${req.file.originalname}" to task "${task.title}"`,
      },
    });

    logger.info(`File uploaded: ${req.file.originalname} to task ${taskId}`);
    res.status(201).json(attachment);
  } catch (err) {
    logger.error("[uploadAttachment]", err);
    res.status(500).json({ error: "Failed to upload file" });
  }
};

export const getAttachments = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(attachments);
  } catch (err) {
    logger.error("[getAttachments]", err);
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
};

export const downloadAttachment = async (req: Request, res: Response) => {
  try {
    const attachmentId = req.params.attachmentId as string;

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const filePath = path.join(UPLOAD_DIR, attachment.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on disk" });
    }

    res.download(filePath, attachment.originalName);
  } catch (err) {
    logger.error("[downloadAttachment]", err);
    res.status(500).json({ error: "Failed to download file" });
  }
};

export const deleteAttachment = async (req: Request, res: Response) => {
  try {
    const attachmentId = req.params.attachmentId as string;

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // Delete file from disk
    const filePath = path.join(UPLOAD_DIR, attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.attachment.delete({ where: { id: attachmentId } });

    logger.info(`Attachment deleted: ${attachment.originalName}`);
    res.json({ message: "Attachment deleted" });
  } catch (err) {
    logger.error("[deleteAttachment]", err);
    res.status(500).json({ error: "Failed to delete attachment" });
  }
};
