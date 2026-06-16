import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis, isRedisAvailable } from "../config/redis.js";

const createRateLimiter = () => {
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 100;

  if (isRedisAvailable && redis) {
    try {
      return rateLimit({
        windowMs,
        max: maxRequests,
        store: new RedisStore({
          sendCommand: (...args: string[]) => redis.call(...args),
        }),
        message: { message: "Too many requests, please try again later." },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => req.ip || "unknown",
        skip: (req) => req.path === "/health",
      });
    } catch (err) {
      console.warn("Failed to create Redis rate limiter, using memory store:", err);
    }
  }

  return rateLimit({
    windowMs,
    max: maxRequests,
    message: { message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || "unknown",
    skip: (req) => req.path === "/health",
  });
};

export const rateLimiter = createRateLimiter();

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || "unknown",
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});