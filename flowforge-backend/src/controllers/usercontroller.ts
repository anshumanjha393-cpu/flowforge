import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { logger } from "../config/logger.js";

const userSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { q, role, page = "1", limit = "50" } = req.query;
    const search = typeof q === "string" ? q.trim() : "";
    const roleFilter = typeof role === "string" ? role.toUpperCase() : "";
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    if (search) {
      where.email = { contains: search, mode: "insensitive" };
    }
    if (roleFilter && ["ADMIN", "MANAGER", "MEMBER"].includes(roleFilter)) {
      where.role = roleFilter as Role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

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

    res.json({
      data: users.map((user) => ({
        ...user,
        taskCount: countMap.get(user.id) ?? 0,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    logger.error("[getUsers]", err);
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
    logger.error("[getUserById]", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { role: role as Role },
      select: userSelect,
    });

    logger.info(`User role updated: ${user.email} -> ${role}`);
    res.json(user);
  } catch (err: unknown) {
    logger.error("[updateUserRole]", err);
    if ((err as { code?: string })?.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(500).json({ message: "Failed to update role" });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    logger.error("[getProfile]", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: name || null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    logger.info(`Profile updated: ${user.email}`);
    res.json(user);
  } catch (err) {
    logger.error("[updateProfile]", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "This account uses OAuth. Password change not available." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info(`Password changed for user: ${userId}`);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    logger.error("[changePassword]", err);
    res.status(500).json({ message: "Failed to change password" });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    logger.error("[getNotifications]", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const markNotificationsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    logger.error("[markNotificationsRead]", err);
    res.status(500).json({ message: "Failed to update notifications" });
  }
};

export const inviteUser = async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;

    const existing = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (existing) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await prisma.user.findFirst().then(async (u) => {
      return u ? u.password : "";
    });

    const user = await prisma.user.create({
      data: {
        email: email.trim(),
        password: hashedPassword || "$2a$10$placeholderhashplaceholderhashplace",
        role: (role ?? "MEMBER") as Role,
        status: "INVITED",
      },
    });

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

    logger.info(`User invited: ${user.email} by ${userEmail}`);
    res.status(201).json(user);
  } catch (err) {
    logger.error("[inviteUser]", err);
    res.status(500).json({ message: "Failed to invite member" });
  }
};
