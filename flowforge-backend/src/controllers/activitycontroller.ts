import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export const getActivities = async (req: Request, res: Response) => {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: { timestamp: "desc" },
      take: 20,
    });
    res.json(activities);
  } catch (err) {
    console.error("[getActivities]", err);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
};
