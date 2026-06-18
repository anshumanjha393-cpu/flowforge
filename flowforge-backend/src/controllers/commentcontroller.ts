import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

export const getComments = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(comments);
  } catch (err) {
    logger.error("[getComments]", err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;
    const { content } = req.body;
    const userId = req.user!.userId;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
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
        action: "COMMENTED",
        details: `${capitalizedUser} commented on task "${task.title}"`,
      },
    });

    logger.info(`Comment created on task ${taskId} by ${userEmail}`);
    res.status(201).json(comment);
  } catch (err) {
    logger.error("[createComment]", err);
    res.status(500).json({ error: "Failed to create comment" });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { taskId, commentId } = req.params as { taskId: string; commentId: string };
    const userId = req.user!.userId;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.taskId !== taskId) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.userId !== userId && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    res.json({ message: "Comment deleted" });
  } catch (err) {
    logger.error("[deleteComment]", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};
