import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";
import crypto from "crypto";

export const getWebhooks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { workspaceId, page = "1", limit = "50" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    if (workspaceId && typeof workspaceId === "string") {
      where.workspaceId = workspaceId;
    } else {
      where.userId = userId;
    }

    const [webhooks, total] = await Promise.all([
      prisma.webhook.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
        include: {
          _count: {
            select: { logs: true },
          },
        },
      }),
      prisma.webhook.count({ where }),
    ]);

    res.json({
      data: webhooks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    logger.error("[getWebhooks]", err);
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
};

export const createWebhook = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { name, url, events, secret, workspaceId } = req.body;

    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "URL is required" });
      return;
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: "At least one event is required" });
      return;
    }

    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: "Invalid URL format" });
      return;
    }

    const webhook = await prisma.webhook.create({
      data: {
        name: name.trim(),
        url: url.trim(),
        events,
        secret: secret || crypto.randomBytes(32).toString("hex"),
        userId,
        workspaceId: workspaceId || null,
      },
    });

    logger.info(`Webhook created: "${webhook.name}" by ${req.user?.email}`);
    res.status(201).json(webhook);
  } catch (err) {
    logger.error("[createWebhook]", err);
    res.status(500).json({ error: "Failed to create webhook" });
  }
};

export const updateWebhook = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const id = req.params.id as string;
    const { name, url, events, secret, isActive, workspaceId } = req.body;

    const existing = await prisma.webhook.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Webhook not found" });
      return;
    }

    if (existing.userId !== userId && req.user?.role !== "ADMIN") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (url !== undefined) {
      try {
        new URL(url);
      } catch {
        res.status(400).json({ error: "Invalid URL format" });
        return;
      }
      data.url = url;
    }
    if (events !== undefined) {
      if (!Array.isArray(events) || events.length === 0) {
        res.status(400).json({ error: "At least one event is required" });
        return;
      }
      data.events = events;
    }
    if (secret !== undefined) data.secret = secret;
    if (isActive !== undefined) data.isActive = isActive;
    if (workspaceId !== undefined) data.workspaceId = workspaceId || null;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "No valid fields provided to update" });
      return;
    }

    const webhook = await prisma.webhook.update({
      where: { id },
      data: data as never,
    });

    res.json(webhook);
  } catch (err: unknown) {
    logger.error("[updateWebhook]", err);
    if ((err as { code?: string })?.code === "P2025") {
      res.status(404).json({ error: "Webhook not found" });
      return;
    }
    res.status(500).json({ error: "Failed to update webhook" });
  }
};

export const deleteWebhook = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const id = req.params.id as string;

    const existing = await prisma.webhook.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Webhook not found" });
      return;
    }

    if (existing.userId !== userId && req.user?.role !== "ADMIN") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    await prisma.webhook.delete({ where: { id } });

    logger.info(`Webhook deleted: "${existing.name}" by ${req.user?.email}`);
    res.json({ message: "Webhook deleted" });
  } catch (err: unknown) {
    logger.error("[deleteWebhook]", err);
    if ((err as { code?: string })?.code === "P2025") {
      res.status(404).json({ error: "Webhook not found" });
      return;
    }
    res.status(500).json({ error: "Failed to delete webhook" });
  }
};

export const testWebhook = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const id = req.params.id as string;

    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) {
      res.status(404).json({ error: "Webhook not found" });
      return;
    }

    if (webhook.userId !== userId && req.user?.role !== "ADMIN") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    const payload = {
      event: "ping",
      timestamp: new Date().toISOString(),
      webhookId: webhook.id,
      message: "This is a test webhook delivery",
    };

    let status: number | null = null;
    let responseText: string | null = null;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Event": "ping",
      };

      if (webhook.secret) {
        const signature = crypto
          .createHmac("sha256", webhook.secret)
          .update(JSON.stringify(payload))
          .digest("hex");
        headers["X-Webhook-Signature"] = `sha256=${signature}`;
      }

      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      status = response.status;
      responseText = await response.text();
    } catch (fetchErr) {
      status = 0;
      responseText = fetchErr instanceof Error ? fetchErr.message : "Request failed";
    }

    await prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        event: "ping",
        payload,
        status,
        response: responseText?.substring(0, 1000) || null,
      },
    });

    logger.info(`Webhook test: "${webhook.name}" -> status ${status}`);
    res.json({
      status,
      response: responseText?.substring(0, 500),
      success: status !== null && status >= 200 && status < 300,
    });
  } catch (err) {
    logger.error("[testWebhook]", err);
    res.status(500).json({ error: "Failed to test webhook" });
  }
};

export const getWebhookLogs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const id = req.params.id as string;
    const { page = "1", limit = "50" } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) {
      res.status(404).json({ error: "Webhook not found" });
      return;
    }

    if (webhook.userId !== userId && req.user?.role !== "ADMIN") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    const [logs, total] = await Promise.all([
      prisma.webhookLog.findMany({
        where: { webhookId: id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.webhookLog.count({ where: { webhookId: id } }),
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
    logger.error("[getWebhookLogs]", err);
    res.status(500).json({ error: "Failed to fetch webhook logs" });
  }
};
