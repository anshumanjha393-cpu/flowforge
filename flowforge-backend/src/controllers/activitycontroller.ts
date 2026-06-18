import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

export const getActivities = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        orderBy: { timestamp: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.activity.count(),
    ]);

    res.json({
      data: activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    logger.error("[getActivities]", err);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
};
