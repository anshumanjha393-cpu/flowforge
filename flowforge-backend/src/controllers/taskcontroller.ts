import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";
import { cache } from "../config/cache.js";

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "50", search, status, priority, projectId } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const cacheKey = `cache:tasks:${projectId || "all"}:${pageNum}:${limitNum}:${search || ""}:${status || ""}:${priority || ""}`;
    const cached = await cache.get<{
      data: unknown[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const where: Record<string, unknown> = {};

    if (search && typeof search === "string") {
      where.title = { contains: search, mode: "insensitive" };
    }
    if (status && typeof status === "string" && ["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
      where.status = status;
    }
    if (priority && typeof priority === "string" && ["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      where.priority = priority;
    }
    if (projectId && typeof projectId === "string") {
      where.projectId = projectId;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
        include: {
          assignee: {
            select: { id: true, email: true, name: true },
          },
          project: {
            select: { id: true, name: true },
          },
          _count: {
            select: { comments: true, attachments: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    const result = {
      data: tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    await cache.set(cacheKey, result, 60);
    res.json(result);
  } catch (err) {
    logger.error("[getTasks]", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, status, priority, assigneeId, projectId, dueDate } = req.body;
    const userId = req.user?.userId || "unknown";
    const userEmail = req.user?.email || "unknown@flowforge.com";

    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: title.trim(),
          description: description || null,
          status: status ?? "TODO",
          priority: priority ?? "MEDIUM",
          assigneeId: assigneeId || null,
          projectId: projectId || null,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      });

      const userName = userEmail.split("@")[0] || "unknown";
      const capitalizedUser = userName.charAt(0).toUpperCase() + userName.slice(1);

      await tx.activity.create({
        data: {
          userId,
          userEmail,
          action: "CREATED",
          details: `${capitalizedUser} created task "${task.title}"`,
        },
      });

      if (assigneeId) {
        await tx.notification.create({
          data: {
            userId: assigneeId,
            type: "ASSIGNMENT",
            title: "New Task Assigned",
            message: `You have been assigned to task "${task.title}"`,
            taskId: task.id,
          },
        });
      }

      return task;
    });

    await cache.invalidateTasks(projectId);
    logger.info(`Task created: ${result.title} by ${userEmail}`);
    res.status(201).json(result);
  } catch (err) {
    logger.error("[createTask]", err);
    res.status(500).json({ error: "Failed to create task" });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, description, status, priority, assigneeId, projectId, dueDate } = req.body;
    const data: Record<string, unknown> = {};

    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description || null;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
    if (projectId !== undefined) data.projectId = projectId || null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "No valid fields provided to update" });
      return;
    }

    const oldTask = await prisma.task.findUnique({ where: { id } });
    if (!oldTask) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    // Any authenticated user can update task status on the board
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id },
        data: data as never,
      });

      if (status !== undefined && oldTask.status !== status) {
        const userEmail = req.user?.email || "unknown@flowforge.com";
        const userName = userEmail.split("@")[0] || "unknown";
        const capitalizedUser = userName.charAt(0).toUpperCase() + userName.slice(1);
        const statusLabels: Record<string, string> = {
          TODO: "Todo",
          IN_PROGRESS: "In Progress",
          DONE: "Done",
        };

        await tx.activity.create({
          data: {
            userId: req.user?.userId || "unknown",
            userEmail,
            action: status === "DONE" ? "COMPLETED" : "MOVED",
            details: `${capitalizedUser} moved task "${task.title}" to ${statusLabels[status] || status}`,
          },
        });
      }

      if (assigneeId && assigneeId !== oldTask.assigneeId && assigneeId) {
        await tx.notification.create({
          data: {
            userId: assigneeId,
            type: "ASSIGNMENT",
            title: "New Task Assigned",
            message: `You have been assigned to task "${task.title}"`,
            taskId: task.id,
          },
        });
      }

      return task;
    });

    await cache.invalidateTasks(oldTask.projectId || undefined);
    if (projectId && projectId !== oldTask.projectId) {
      await cache.invalidateTasks(projectId);
    }

    res.json(result);
  } catch (err: unknown) {
    logger.error("[updateTask]", err);
    if ((err as { code?: string })?.code === "P2025") {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.status(500).json({ error: "Failed to update task" });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    // Role-based authorization:
    // Only ADMIN can delete tasks
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    if (user.role !== "ADMIN") {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.delete({ where: { id } });

      const userEmail = req.user?.email || "unknown@flowforge.com";
      const userName = userEmail.split("@")[0] || "unknown";
      const capitalizedUser = userName.charAt(0).toUpperCase() + userName.slice(1);

      await tx.activity.create({
        data: {
          userId: req.user?.userId || "unknown",
          userEmail,
          action: "DELETED",
          details: `${capitalizedUser} deleted task "${task.title}"`,
        },
      });
    });

    await cache.invalidateTasks(task.projectId || undefined);
    logger.info(`Task deleted: ${task.title} by ${req.user?.email}`);
    res.json({ message: "Task deleted" });
  } catch (err: unknown) {
    logger.error("[deleteTask]", err);
    if ((err as { code?: string })?.code === "P2025") {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.status(500).json({ error: "Failed to delete task" });
  }
};
