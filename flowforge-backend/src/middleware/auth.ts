import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { redis, isRedisAvailable } from "../config/redis.js";

export interface AuthPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "MEMBER";
}

// Extend Express Request to include our user type
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthPayload;
  }
}

// In-memory fallbacks when Redis is not available
const memoryFailedAttempts = new Map<string, { count: number; resetTime: number }>();
const memoryBlockedIps = new Map<string, number>();

export const isIpBlocked = async (ip: string): Promise<boolean> => {
  if (isRedisAvailable && redis) {
    try {
      const blocked = await redis.get(`block:${ip}`);
      return blocked !== null;
    } catch (err) {
      console.error("Redis error checking IP block:", err);
    }
  }

  const blockResetTime = memoryBlockedIps.get(ip);
  if (blockResetTime) {
    if (Date.now() < blockResetTime) {
      return true;
    }
    memoryBlockedIps.delete(ip);
  }
  return false;
};

export const recordFailedAttempt = async (ip: string): Promise<void> => {
  if (isRedisAvailable && redis) {
    try {
      const failKey = `fail:${ip}`;
      const attemptsStr = await redis.get(failKey);
      let attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
      attempts += 1;

      if (attempts >= 5) {
        await redis.set(`block:${ip}`, "blocked", "EX", 1800);
        await redis.del(failKey);
        console.warn(`IP ${ip} blocked for 30 minutes due to 5 failed logins`);
      } else {
        if (attempts === 1) {
          await redis.set(failKey, "1", "EX", 900);
        } else {
          await redis.incr(failKey);
        }
      }
      return;
    } catch (err) {
      console.error("Redis error recording failed login:", err);
    }
  }

  const now = Date.now();
  let attempt = memoryFailedAttempts.get(ip);
  if (!attempt || now > attempt.resetTime) {
    attempt = { count: 0, resetTime: now + 15 * 60 * 1000 };
  }
  attempt.count += 1;

  if (attempt.count >= 5) {
    memoryBlockedIps.set(ip, now + 30 * 60 * 1000);
    memoryFailedAttempts.delete(ip);
    console.warn(`IP ${ip} blocked (memory) for 30 minutes due to 5 failed logins`);
  } else {
    memoryFailedAttempts.set(ip, attempt);
  }
};

export const clearFailedAttempts = async (ip: string): Promise<void> => {
  if (isRedisAvailable && redis) {
    try {
      await redis.del(`fail:${ip}`);
      await redis.del(`block:${ip}`);
      return;
    } catch (err) {
      console.error("Redis error clearing failed attempts:", err);
    }
  }
  memoryFailedAttempts.delete(ip);
  memoryBlockedIps.delete(ip);
};

export const checkIpBlockMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || "unknown";
  if (await isIpBlocked(ip)) {
    return res.status(403).json({
      message: "Too many failed login attempts. Your IP is temporarily blocked for 30 minutes.",
    });
  }
  next();
};

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Check Session Cookie First
  // @ts-ignore
  if (req.session && req.session.user) {
    // @ts-ignore
    const loginIp = req.session.loginIp;
    if (loginIp && loginIp !== req.ip) {
      console.warn(`Session IP mismatch: loginIp=${loginIp}, currentIp=${req.ip}`);
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        return res.status(401).json({
          message: "Session IP address changed. Please log in again for security.",
        });
      });
      return;
    }

    // @ts-ignore
    req.user = req.session.user as AuthPayload;
    return next();
  }

  // 2. Fallback to JWT Bearer Token
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (...roles: AuthPayload["role"][]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};
