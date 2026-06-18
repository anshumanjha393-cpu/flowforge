import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

export const getProjects = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "50", search } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          tasks: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.project.count({ where }),
    ]);

    const projectsWithProgress = projects.map((project) => {
      const totalTasks = project.tasks.length;
      if (totalTasks === 0) {
        return { ...project, progress: project.progress };
      }
      const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
      const progress = Math.round((doneTasks / totalTasks) * 100);
      return {
        ...project,
        progress,
      };
    });

    res.json({
      data: projectsWithProgress,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    logger.error("[getProjects]", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, priority, dueDate } = req.body;

    const existing = await prisma.project.findFirst({
      where: { name: name.trim() },
    });

    if (existing) {
      res.status(400).json({ error: "Project with this name already exists" });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        priority: priority ?? "MEDIUM",
        status: "IN_PROGRESS",
        progress: 0,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    const userEmail = req.user?.email || "unknown@flowforge.com";
    await prisma.activity.create({
      data: {
        userId: req.user?.userId || "system",
        userEmail,
        action: "PROJECT_CREATED",
        details: `${userEmail.split("@")[0]} created project "${project.name}"`,
      },
    });

    logger.info(`Project created: ${project.name} by ${userEmail}`);
    res.status(201).json(project);
  } catch (err) {
    logger.error("[createProject]", err);
    res.status(500).json({ error: "Failed to create project" });
  }
};
