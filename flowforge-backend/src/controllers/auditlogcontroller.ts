import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

export const logAudit = async (params: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ip?: string;
}) => {
  try {
    const data: Record<string, unknown> = {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      ip: params.ip ?? null,
    };
    if (params.oldValues) data.oldValues = params.oldValues;
    if (params.newValues) data.newValues = params.newValues;

    await prisma.auditLog.create({
      data: data as never,
    });
  } catch (err) {
    logger.error("[logAudit]", err);
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "50", entity, action, userId, startDate, endDate } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    if (entity && typeof entity === "string") {
      where.entity = entity;
    }
    if (action && typeof action === "string") {
      where.action = action;
    }
    if (userId && typeof userId === "string") {
      where.userId = userId;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate && typeof startDate === "string") {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate && typeof endDate === "string") {
        (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    logger.error("[getAuditLogs]", err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
};

export const getAuditLogsByEntity = async (req: Request, res: Response) => {
  try {
    const entity = req.params.entity as string;
    const entityId = req.params.entityId as string;
    const { page = "1", limit = "50" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where = { entity, entityId };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    logger.error("[getAuditLogsByEntity]", err);
    res.status(500).json({ error: "Failed to fetch audit logs for entity" });
  }
};

export const exportAuditLogs = async (req: Request, res: Response) => {
  try {
    const { entity, action, userId, startDate, endDate } = req.query;

    const where: Record<string, unknown> = {};

    if (entity && typeof entity === "string") {
      where.entity = entity;
    }
    if (action && typeof action === "string") {
      where.action = action;
    }
    if (userId && typeof userId === "string") {
      where.userId = userId;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate && typeof startDate === "string") {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate && typeof endDate === "string") {
        (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const header = "ID,User,Action,Entity,Entity ID,Old Values,New Values,IP,Created At";
    const rows = logs.map((log) => {
      const oldValues = log.oldValues ? JSON.stringify(log.oldValues).replace(/"/g, '""') : "";
      const newValues = log.newValues ? JSON.stringify(log.newValues).replace(/"/g, '""') : "";
      const email = log.user?.email ?? "";
      const entityId = log.entityId ?? "";
      const ip = log.ip ?? "";
      const createdAt = log.createdAt.toISOString();
      return `${log.id},"${email}","${log.action}","${log.entity}","${entityId}","${oldValues}","${newValues}","${ip}","${createdAt}"`;
    });

    const csv = [header, ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="audit-logs-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    logger.error("[exportAuditLogs]", err);
    res.status(500).json({ error: "Failed to export audit logs" });
  }
};
