import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

export const getSprints = async (req: Request, res: Response) => {
  try {
    const { projectId, workspaceId, status } = req.query;

    const where: Record<string, unknown> = {};

    if (projectId && typeof projectId === "string") {
      where.projectId = projectId;
    }
    if (workspaceId && typeof workspaceId === "string") {
      where.workspaceId = workspaceId;
    }
    if (status && typeof status === "string" && ["PLANNING", "ACTIVE", "COMPLETED"].includes(status)) {
      where.status = status;
    }

    const sprints = await prisma.sprint.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: sprints });
  } catch (err) {
    logger.error("[getSprints]", err);
    res.status(500).json({ error: "Failed to fetch sprints" });
  }
};

export const createSprint = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userEmail = req.user?.email;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { name, description, startDate, endDate, goal, projectId, workspaceId } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Sprint name is required" });
      return;
    }
    if (!startDate || !endDate) {
      res.status(400).json({ error: "Start date and end date are required" });
      return;
    }
    if (!projectId) {
      res.status(400).json({ error: "Project ID is required" });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }
    if (end <= start) {
      res.status(400).json({ error: "End date must be after start date" });
      return;
    }

    const sprint = await prisma.sprint.create({
      data: {
        name: name.trim(),
        description: description || null,
        startDate: start,
        endDate: end,
        goal: goal || null,
        status: "PLANNING",
        projectId,
        workspaceId: workspaceId || null,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    logger.info(`Sprint created: ${sprint.name} by ${userEmail}`);
    res.status(201).json(sprint);
  } catch (err) {
    logger.error("[createSprint]", err);
    res.status(500).json({ error: "Failed to create sprint" });
  }
};

export const updateSprint = async (req: Request, res: Response) => {
  try {
    const sprintId = req.params.id as string;
    const { name, description, startDate, endDate, goal } = req.body;

    const existing = await prisma.sprint.findUnique({ where: { id: sprintId } });
    if (!existing) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description || null;
    if (startDate !== undefined) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = new Date(endDate);
    if (goal !== undefined) data.goal = goal || null;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "No valid fields provided to update" });
      return;
    }

    if (data.startDate && data.endDate) {
      if ((data.endDate as Date) <= (data.startDate as Date)) {
        res.status(400).json({ error: "End date must be after start date" });
        return;
      }
    }

    const sprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: data as never,
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    logger.info(`Sprint updated: ${sprint.name}`);
    res.json(sprint);
  } catch (err: unknown) {
    logger.error("[updateSprint]", err);
    if ((err as { code?: string })?.code === "P2025") {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }
    res.status(500).json({ error: "Failed to update sprint" });
  }
};

export const startSprint = async (req: Request, res: Response) => {
  try {
    const sprintId = req.params.id as string;
    const userEmail = req.user?.email;

    const existing = await prisma.sprint.findUnique({ where: { id: sprintId } });
    if (!existing) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }

    if (existing.status === "ACTIVE") {
      res.status(400).json({ error: "Sprint is already active" });
      return;
    }

    if (existing.status === "COMPLETED") {
      res.status(400).json({ error: "Cannot start a completed sprint" });
      return;
    }

    const sprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: { status: "ACTIVE" },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    logger.info(`Sprint started: ${sprint.name} by ${userEmail}`);
    res.json(sprint);
  } catch (err: unknown) {
    logger.error("[startSprint]", err);
    if ((err as { code?: string })?.code === "P2025") {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }
    res.status(500).json({ error: "Failed to start sprint" });
  }
};

export const completeSprint = async (req: Request, res: Response) => {
  try {
    const sprintId = req.params.id as string;
    const userEmail = req.user?.email;

    const existing = await prisma.sprint.findUnique({ where: { id: sprintId } });
    if (!existing) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }

    if (existing.status === "COMPLETED") {
      res.status(400).json({ error: "Sprint is already completed" });
      return;
    }

    if (existing.status === "PLANNING") {
      res.status(400).json({ error: "Cannot complete a sprint that hasn't been started" });
      return;
    }

    const sprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: { status: "COMPLETED" },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    logger.info(`Sprint completed: ${sprint.name} by ${userEmail}`);
    res.json(sprint);
  } catch (err: unknown) {
    logger.error("[completeSprint]", err);
    if ((err as { code?: string })?.code === "P2025") {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }
    res.status(500).json({ error: "Failed to complete sprint" });
  }
};

export const getSprintById = async (req: Request, res: Response) => {
  try {
    const sprintId = req.params.id as string;

    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: {
          select: { id: true, name: true },
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, email: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!sprint) {
      res.status(404).json({ error: "Sprint not found" });
      return;
    }

    res.json(sprint);
  } catch (err) {
    logger.error("[getSprintById]", err);
    res.status(500).json({ error: "Failed to fetch sprint" });
  }
};
