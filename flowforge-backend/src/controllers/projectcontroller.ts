import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Dynamically calculate progress for each project based on tasks if needed
    const projectsWithProgress = projects.map((project) => {
      const totalTasks = project.tasks.length;
      if (totalTasks === 0) {
        return { ...project, progress: project.progress }; // fallback to seeded progress
      }
      const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
      const progress = Math.round((doneTasks / totalTasks) * 100);
      return {
        ...project,
        progress,
      };
    });

    res.json(projectsWithProgress);
  } catch (err) {
    console.error("[getProjects]", err);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, priority, dueDate } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Project name is required" });
      return;
    }

    const existing = await prisma.project.findUnique({
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

    // Create an activity log
    const userEmail = req.user?.email || "unknown@flowforge.com";
    await prisma.activity.create({
      data: {
        userId: req.user?.userId || "system",
        userEmail,
        action: "PROJECT_CREATED",
        details: `${userEmail.split("@")[0]} created project "${project.name}"`,
      },
    });

    res.status(201).json(project);
  } catch (err) {
    console.error("[createProject]", err);
    res.status(500).json({ error: "Failed to create project" });
  }
};
