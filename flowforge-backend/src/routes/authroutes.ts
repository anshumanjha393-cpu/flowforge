import { Router } from "express";
import passport from "passport";
import { register, login, me, logout, oauthSuccess } from "../controllers/authcontroller.js";
import { authenticate, checkIpBlockMiddleware } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/register", authRateLimiter, checkIpBlockMiddleware, register);
router.post("/login", authRateLimiter, checkIpBlockMiddleware, login);
router.get("/me", authenticate, me);
router.post("/logout", logout);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?error=OAuthFailed", session: false }),
  oauthSuccess
);

// GitHub OAuth
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"], session: false })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login?error=OAuthFailed", session: false }),
  oauthSuccess
);

export default router;
