import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

export const getWorkspaces = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        owner: {
          select: { id: true, email: true, name: true },
        },
        _count: {
          select: { members: true, projects: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: workspaces });
  } catch (err) {
    logger.error("[getWorkspaces]", err);
    res.status(500).json({ error: "Failed to fetch workspaces" });
  }
};

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userEmail = req.user?.email;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { name, description } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Workspace name is required" });
      return;
    }

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await prisma.workspace.findUnique({ where: { slug } });
    if (existing) {
      res.status(400).json({ error: "A workspace with a similar name already exists" });
      return;
    }

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name: name.trim(),
          slug,
          description: description || null,
          ownerId: userId,
        },
      });

      await tx.workspaceMember.create({
        data: {
          userId,
          workspaceId: ws.id,
          role: "OWNER",
        },
      });

      return ws;
    });

    logger.info(`Workspace created: ${workspace.name} by ${userEmail}`);
    res.status(201).json(workspace);
  } catch (err) {
    logger.error("[createWorkspace]", err);
    res.status(500).json({ error: "Failed to create workspace" });
  }
};

export const getWorkspaceById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const workspaceId = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });

    if (!membership) {
      res.status(403).json({ error: "You are not a member of this workspace" });
      return;
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: {
          select: { id: true, email: true, name: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: { projects: true, members: true },
        },
      },
    });

    if (!workspace) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }

    res.json(workspace);
  } catch (err) {
    logger.error("[getWorkspaceById]", err);
    res.status(500).json({ error: "Failed to fetch workspace" });
  }
};

export const addWorkspaceMember = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const workspaceId = req.params.id as string;
    const { email, role } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const requesterMembership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });

    if (!requesterMembership || !["OWNER", "ADMIN"].includes(requesterMembership.role)) {
      res.status(403).json({ error: "Only workspace owners and admins can add members" });
      return;
    }

    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    const userToAdd = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!userToAdd) {
      res.status(404).json({ error: "User with this email not found" });
      return;
    }

    const alreadyMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: userToAdd.id, workspaceId },
      },
    });

    if (alreadyMember) {
      res.status(400).json({ error: "User is already a member of this workspace" });
      return;
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        userId: userToAdd.id,
        workspaceId,
        role: role || "MEMBER",
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    logger.info(`Member added to workspace ${workspaceId}: ${userToAdd.email}`);
    res.status(201).json(newMember);
  } catch (err) {
    logger.error("[addWorkspaceMember]", err);
    res.status(500).json({ error: "Failed to add workspace member" });
  }
};

export const removeWorkspaceMember = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const workspaceId = req.params.id as string;
    const memberId = req.params.memberId as string;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const requesterMembership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });

    if (!requesterMembership || !["OWNER", "ADMIN"].includes(requesterMembership.role)) {
      res.status(403).json({ error: "Only workspace owners and admins can remove members" });
      return;
    }

    const targetMembership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: memberId, workspaceId },
      },
    });

    if (!targetMembership) {
      res.status(404).json({ error: "Member not found in this workspace" });
      return;
    }

    if (targetMembership.role === "OWNER") {
      res.status(400).json({ error: "Cannot remove the workspace owner" });
      return;
    }

    if (memberId === userId) {
      res.status(400).json({ error: "Cannot remove yourself. Use leave workspace instead." });
      return;
    }

    await prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: { userId: memberId, workspaceId },
      },
    });

    logger.info(`Member removed from workspace ${workspaceId}: ${memberId}`);
    res.json({ message: "Member removed from workspace" });
  } catch (err) {
    logger.error("[removeWorkspaceMember]", err);
    res.status(500).json({ error: "Failed to remove workspace member" });
  }
};

export const updateWorkspaceMemberRole = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const workspaceId = req.params.id as string;
    const memberId = req.params.memberId as string;
    const { role } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const requesterMembership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });

    if (!requesterMembership || requesterMembership.role !== "OWNER") {
      res.status(403).json({ error: "Only the workspace owner can update member roles" });
      return;
    }

    if (!role || !["ADMIN", "MEMBER"].includes(role)) {
      res.status(400).json({ error: "Role must be ADMIN or MEMBER" });
      return;
    }

    const targetMembership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: memberId, workspaceId },
      },
    });

    if (!targetMembership) {
      res.status(404).json({ error: "Member not found in this workspace" });
      return;
    }

    if (targetMembership.role === "OWNER") {
      res.status(400).json({ error: "Cannot change the owner's role" });
      return;
    }

    const updated = await prisma.workspaceMember.update({
      where: {
        userId_workspaceId: { userId: memberId, workspaceId },
      },
      data: { role },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    logger.info(`Workspace member role updated: ${memberId} -> ${role} in ${workspaceId}`);
    res.json(updated);
  } catch (err) {
    logger.error("[updateWorkspaceMemberRole]", err);
    res.status(500).json({ error: "Failed to update member role" });
  }
};
