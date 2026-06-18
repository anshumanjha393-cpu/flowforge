import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodIssue } from "zod";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ZodError) {
    const messages = err.issues.map((e: ZodIssue) => `${e.path.join(".")}: ${e.message}`);
    res.status(400).json({
      error: "Validation Error",
      details: messages,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  console.error("[Unhandled Error]", err);
  res.status(500).json({
    error: "Internal server error",
  });
};

export const validate = (schema: { parse: (data: unknown) => unknown }) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
};
