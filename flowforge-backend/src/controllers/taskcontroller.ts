import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export const getTasks = async (
  req: Request,
  res: Response
) => {
  const tasks = await prisma.task.findMany();

  res.json(tasks);
};

export const createTask = async (
  req: Request,
  res: Response
) => {
  const {
    title,
    status,
    priority,
    assigneeId,
    projectId
  } = req.body;

  const task = await prisma.task.create({
    data: {
      title,
      status,
      priority,
      assigneeId,
      projectId
    }
  });

  res.status(201).json(task);
};

export const updateTask = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  const task = await prisma.task.update({
    where: { id },
    data: req.body
  });

  res.json(task);
};

export const deleteTask = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  await prisma.task.delete({
    where: { id }
  });

  res.json({
    message: "Task deleted"
  });
};