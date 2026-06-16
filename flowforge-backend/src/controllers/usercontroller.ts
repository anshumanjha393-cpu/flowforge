import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import type { Role } from "@prisma/client";

const userSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { q, role } = req.query;
    const search = typeof q === "string" ? q.trim() : "";
    const roleFilter = typeof role === "string" ? role.toUpperCase() : "";

    const users = await prisma.user.findMany({
      where: {
        ...(search
          ? { email: { contains: search, mode: "insensitive" as const } }
          : {}),
        ...(roleFilter && ["ADMIN", "MANAGER", "MEMBER"].includes(roleFilter)
          ? { role: roleFilter as Role }
          : {}),
      },
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });

    const taskCounts = await prisma.task.groupBy({
      by: ["assigneeId"],
      _count: { id: true },
      where: { assigneeId: { not: null } },
    });

    const countMap = new Map(
      taskCounts
        .filter((t) => t.assigneeId)
        .map((t) => [t.assigneeId!, t._count.id])
    );

    res.json(
      users.map((user) => ({
        ...user,
        taskCount: countMap.get(user.id) ?? 0,
      }))
    );
  } catch (err) {
    console.error("[getUsers]", err);
    res.status(500).json({ message: "Failed to fetch team members" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const taskCount = await prisma.task.count({
      where: { assigneeId: id },
    });

    const recentTasks = await prisma.task.findMany({
      where: { assigneeId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, priority: true },
    });

    res.json({ ...user, taskCount, recentTasks });
  } catch (err) {
    console.error("[getUserById]", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;

    if (!role || !["ADMIN", "MANAGER", "MEMBER"].includes(role)) {
      return res.status(400).json({ message: "Valid role is required" });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: role as Role },
      select: userSelect,
    });

    res.json(user);
  } catch (err: unknown) {
    console.error("[updateUserRole]", err);
    if ((err as { code?: string })?.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Failed to update role" });
  }
};

export const inviteUser = async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;
    if (!email || typeof email !== "string" || !email.trim()) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (existing) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Hash a placeholder password since they are invited
    const hashedPassword = await prisma.user.findFirst().then(async (u) => {
      return u ? u.password : ""; // reuse existing structure or use dummy
    });

    const user = await prisma.user.create({
      data: {
        email: email.trim(),
        password: hashedPassword || "$2a$10$placeholderhashplaceholderhashplace",
        role: (role ?? "MEMBER"),
        status: "INVITED",
      },
    });

    // Create activity log
    const userEmail = req.user?.email || "unknown@flowforge.com";
    const userName = userEmail.split("@")[0] || "unknown";
    const capitalizedUser = userName.charAt(0).toUpperCase() + userName.slice(1);
    await prisma.activity.create({
      data: {
        userId: req.user?.userId || "unknown",
        userEmail,
        action: "INVITED",
        details: `${capitalizedUser} invited ${user.email} to the Team`,
      },
    });

    res.status(201).json(user);
  } catch (err) {
    console.error("[inviteUser]", err);
    res.status(500).json({ message: "Failed to invite member" });
  }
};

