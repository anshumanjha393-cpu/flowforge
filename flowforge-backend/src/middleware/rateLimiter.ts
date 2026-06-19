import rateLimit from "express-rate-limit";

const createRateLimiter = () => {
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 100;
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: { message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
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
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});