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
        assigneeId: assigneeId ?? null,
        // projectId is optional in schema — falls back to empty string
        // if your schema still requires it, pass a real value here
        projectId: projectId ?? "",
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
    const { id } = req.params;

    // Whitelist only the fields callers are allowed to change
    const { title, status, priority, assigneeId } = req.body;
    const data: Record<string, unknown> = {};

    if (title !== undefined) data.title = title;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (assigneeId !== undefined) data.assigneeId = assigneeId;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "No valid fields provided to update" });
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data,
    });

    res.json(task);
  } catch (err: any) {
    console.error("[updateTask]", err);
    // Prisma throws P2025 when the record doesn't exist
    if (err?.code === "P2025") {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.status(500).json({ error: "Failed to update task" });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({
      where: { id },
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