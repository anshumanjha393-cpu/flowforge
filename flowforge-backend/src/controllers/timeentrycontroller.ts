import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

export const getTimeEntries = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { taskId, startDate, endDate, page = "1", limit = "50" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { userId };

    if (taskId && typeof taskId === "string") {
      where.taskId = taskId;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate && typeof startDate === "string") {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === "string") {
        dateFilter.lte = new Date(endDate);
      }
      where.date = dateFilter;
    }

    const [entries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limitNum,
        include: {
          task: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.timeEntry.count({ where }),
    ]);

    res.json({
      data: entries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    logger.error("[getTimeEntries]", err);
    res.status(500).json({ error: "Failed to fetch time entries" });
  }
};

export const createTimeEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { hours, description, taskId, date } = req.body;

    if (hours === undefined || typeof hours !== "number" || hours <= 0) {
      res.status(400).json({ error: "Hours must be a positive number" });
      return;
    }

    if (!taskId || typeof taskId !== "string") {
      res.status(400).json({ error: "Task ID is required" });
      return;
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const entry = await prisma.timeEntry.create({
      data: {
        hours,
        description: description || null,
        taskId,
        userId,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        task: {
          select: { id: true, title: true },
        },
      },
    });

    logger.info(`Time entry created: ${hours}h on task "${task.title}" by ${req.user?.email}`);
    res.status(201).json(entry);
  } catch (err) {
    logger.error("[createTimeEntry]", err);
    res.status(500).json({ error: "Failed to create time entry" });
  }
};

export const updateTimeEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const id = req.params.id as string;
    const { hours, description, taskId, date } = req.body;

    const existing = await prisma.timeEntry.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Time entry not found" });
      return;
    }

    if (existing.userId !== userId && req.user?.role !== "ADMIN") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    const data: Record<string, unknown> = {};
    if (hours !== undefined) {
      if (typeof hours !== "number" || hours <= 0) {
        res.status(400).json({ error: "Hours must be a positive number" });
        return;
      }
      data.hours = hours;
    }
    if (description !== undefined) data.description = description || null;
    if (taskId !== undefined) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
      }
      data.taskId = taskId;
    }
    if (date !== undefined) data.date = new Date(date);

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "No valid fields provided to update" });
      return;
    }

    const entry = await prisma.timeEntry.update({
      where: { id },
      data: data as never,
      include: {
        task: {
          select: { id: true, title: true },
        },
      },
    });

    res.json(entry);
  } catch (err: unknown) {
    logger.error("[updateTimeEntry]", err);
    if ((err as { code?: string })?.code === "P2025") {
      res.status(404).json({ error: "Time entry not found" });
      return;
    }
    res.status(500).json({ error: "Failed to update time entry" });
  }
};

export const deleteTimeEntry = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const id = req.params.id as string;

    const existing = await prisma.timeEntry.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Time entry not found" });
      return;
    }

    if (existing.userId !== userId && req.user?.role !== "ADMIN") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    await prisma.timeEntry.delete({ where: { id } });

    logger.info(`Time entry deleted: ${id} by ${req.user?.email}`);
    res.json({ message: "Time entry deleted" });
  } catch (err: unknown) {
    logger.error("[deleteTimeEntry]", err);
    if ((err as { code?: string })?.code === "P2025") {
      res.status(404).json({ error: "Time entry not found" });
      return;
    }
    res.status(500).json({ error: "Failed to delete time entry" });
  }
};

export const getTimeSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { groupBy = "day", startDate, endDate } = req.query;

    const where: Record<string, unknown> = { userId };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate && typeof startDate === "string") {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === "string") {
        dateFilter.lte = new Date(endDate);
      }
      where.date = dateFilter;
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      select: { hours: true, date: true },
      orderBy: { date: "asc" },
    });

    const grouped: Record<string, number> = {};

    for (const entry of entries) {
      const d = new Date(entry.date);
      let key: string;

      if (groupBy === "week") {
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000);
        const weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
      } else if (groupBy === "month") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = d.toISOString().split("T")[0] ?? "";
      }

      grouped[key] = (grouped[key] || 0) + entry.hours;
    }

    const summary = Object.entries(grouped).map(([period, totalHours]) => ({
      period,
      totalHours: Math.round(totalHours * 100) / 100,
    }));

    const grandTotal = Math.round(entries.reduce((sum, e) => sum + e.hours, 0) * 100) / 100;

    res.json({ summary, grandTotal, groupBy });
  } catch (err) {
    logger.error("[getTimeSummary]", err);
    res.status(500).json({ error: "Failed to fetch time summary" });
  }
};
