import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { logger } from "../config/logger.js";

export const submitSupportTicket = async (req: Request, res: Response) => {
  try {
    const { subject, message } = req.body;
    const userId = req.user?.userId;
    const email = req.user?.email;

    if (!email) {
      return res.status(401).json({ error: "User email not found in session." });
    }

    if (!subject || !subject.trim() || !message || !message.trim()) {
      return res.status(400).json({ error: "Subject and message are required." });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: userId || null,
        email,
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    logger.info(`Support ticket created: ${ticket.id} by ${email}`);
    res.status(201).json({ message: "Support ticket submitted successfully.", ticket });
  } catch (err) {
    logger.error("[submitSupportTicket]", err);
    res.status(500).json({ error: "Failed to submit support ticket." });
  }
};

export const submitBugReport = async (req: Request, res: Response) => {
  try {
    const { title, steps, severity, description } = req.body;
    const userId = req.user?.userId;
    const email = req.user?.email;

    if (!email) {
      return res.status(401).json({ error: "User email not found in session." });
    }

    if (!title || !title.trim() || !steps || !steps.trim() || !description || !description.trim()) {
      return res.status(400).json({ error: "Title, steps, and description are required." });
    }

    const validSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const bugSeverity = validSeverities.includes(severity) ? severity : "MEDIUM";

    const bugReport = await prisma.bugReport.create({
      data: {
        userId: userId || null,
        email,
        title: title.trim(),
        steps: steps.trim(),
        severity: bugSeverity,
        description: description.trim(),
      },
    });

    logger.info(`Bug report created: ${bugReport.id} by ${email}`);
    res.status(201).json({ message: "Bug report submitted successfully.", bugReport });
  } catch (err) {
    logger.error("[submitBugReport]", err);
    res.status(500).json({ error: "Failed to submit bug report." });
  }
};
