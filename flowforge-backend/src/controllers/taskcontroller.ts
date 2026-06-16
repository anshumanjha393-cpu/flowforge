import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(tasks);
  } catch (err) {
    console.error("[getTasks]", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, status, priority, assigneeId, projectId } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "title is required" });
      return;
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        status: status ?? "TODO",
        priority: priority ?? "MEDIUM",
        assigneeId: assigneeId || null,
        projectId: projectId || null,
      },
    });

    // Create an activity log
    const userEmail = req.user?.email || "unknown@flowforge.com";
    const userName = userEmail.split("@")[0] || "unknown";
    const capitalizedUser = userName.charAt(0).toUpperCase() + userName.slice(1);

    await prisma.activity.create({
      data: {
        userId: req.user?.userId || "unknown",
        userEmail,
        action: "CREATED",
        details: `${capitalizedUser} created task "${task.title}"`,
      },
    });

    res.status(201).json(task);
  } catch (err) {
    console.error("[createTask]", err);
    res.status(500).json({ error: "Failed to create task" });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Whitelist only the fields callers are allowed to change
    const { title, status, priority, assigneeId, projectId } = req.body;
    const data: Record<string, any> = {};

    if (title !== undefined) data.title = title;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
    if (projectId !== undefined) data.projectId = projectId || null;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "No valid fields provided to update" });
      return;
    }

    // Fetch the task before update to see if status changes
    const oldTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!oldTask) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data: data as any,
    });

    // Create an activity log if status changed
    if (status !== undefined && oldTask.status !== status) {
      const userEmail = req.user?.email || "unknown@flowforge.com";
      const userName = userEmail.split("@")[0] || "unknown";
      const capitalizedUser = userName.charAt(0).toUpperCase() + userName.slice(1);

      const statusLabels: Record<string, string> = {
        TODO: "Todo",
        IN_PROGRESS: "In Progress",
        DONE: "Done",
      };

      await prisma.activity.create({
        data: {
          userId: req.user?.userId || "unknown",
          userEmail,
          action: "MOVED",
          details: `${capitalizedUser} moved task "${task.title}" to ${statusLabels[status] || status}`,
        },
      });
    }

    res.json(task);
  } catch (err: any) {
    console.error("[updateTask]", err);
    if (err?.code === "P2025") {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.status(500).json({ error: "Failed to update task" });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    await prisma.task.delete({
      where: { id },
    });

    // Create an activity log
    const userEmail = req.user?.email || "unknown@flowforge.com";
    const userName = userEmail.split("@")[0] || "unknown";
    const capitalizedUser = userName.charAt(0).toUpperCase() + userName.slice(1);

    await prisma.activity.create({
      data: {
        userId: req.user?.userId || "unknown",
        userEmail,
        action: "DELETED",
        details: `${capitalizedUser} deleted task "${task.title}"`,
      },
    });

    res.json({ message: "Task deleted" });
  } catch (err: any) {
    console.error("[deleteTask]", err);
    if (err?.code === "P2025") {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.status(500).json({ error: "Failed to delete task" });
  }
};