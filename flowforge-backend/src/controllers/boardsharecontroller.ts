import crypto from "crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

export const createBoardShare = async (req: Request, res: Response) => {
  try {
    const { projectId, role, expiresAt } = req.body;
    const userId = req.user?.userId;
    const userEmail = req.user?.email;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!projectId || typeof projectId !== "string") {
      res.status(400).json({ error: "projectId is required" });
      return;
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const token = crypto.randomUUID();

    const share = await prisma.boardShare.create({
      data: {
        projectId,
        token,
        role: role ?? "VIEWER",
        userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    logger.info(`Board share created for project ${projectId} by ${userEmail}`);
    res.status(201).json(share);
  } catch (err) {
    logger.error("[createBoardShare]", err);
    res.status(500).json({ error: "Failed to create board share" });
  }
};

export const getBoardShares = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;

    const shares = await prisma.boardShare.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: shares });
  } catch (err) {
    logger.error("[getBoardShares]", err);
    res.status(500).json({ error: "Failed to fetch board shares" });
  }
};

export const getBoardShareByToken = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;

    const share = await prisma.boardShare.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!share) {
      res.status(404).json({ error: "Share link not found" });
      return;
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      res.status(410).json({ error: "Share link has expired" });
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: share.projectId },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.json({
      share: {
        role: share.role,
        createdAt: share.createdAt,
      },
      project,
    });
  } catch (err) {
    logger.error("[getBoardShareByToken]", err);
    res.status(500).json({ error: "Failed to fetch shared board" });
  }
};

export const deleteBoardShare = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const share = await prisma.boardShare.findUnique({ where: { id } });

    if (!share) {
      res.status(404).json({ error: "Share link not found" });
      return;
    }

    if (share.userId !== userId && req.user?.role !== ("ADMIN" as string)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    await prisma.boardShare.delete({ where: { id } });

    logger.info(`Board share ${id} deleted by ${req.user?.email}`);
    res.json({ message: "Share link revoked" });
  } catch (err) {
    logger.error("[deleteBoardShare]", err);
    res.status(500).json({ error: "Failed to revoke board share" });
  }
};
