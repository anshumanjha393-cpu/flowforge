import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { recordFailedAttempt, clearFailedAttempts } from "../middleware/auth.js";
import { logger } from "../config/logger.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    // @ts-ignore
    req.session.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    // @ts-ignore
    req.session.loginIp = req.ip;

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    logger.info(`New user registered: ${email}`);
    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    logger.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      await recordFailedAttempt(req.ip || "unknown");
      logger.warn(`Failed login attempt for ${email} from ${req.ip}`);
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    if (!user.password) {
      await recordFailedAttempt(req.ip || "unknown");
      return res.status(400).json({ message: "This account uses OAuth sign-in. Please log in with Google or GitHub." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await recordFailedAttempt(req.ip || "unknown");
      logger.warn(`Failed login attempt for ${email} from ${req.ip}`);
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    await clearFailedAttempts(req.ip || "unknown");

    // @ts-ignore
    req.session.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    // @ts-ignore
    req.session.loginIp = req.ip;

    if (rememberMe === false) {
      // @ts-ignore
      req.session.cookie.maxAge = undefined;
    } else {
      // @ts-ignore
      req.session.cookie.maxAge = 21 * 24 * 60 * 60 * 1000;
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    logger.info(`User logged in: ${email}`);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, createdAt: true, googleId: true, githubId: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      user,
      token,
    });
  } catch (error) {
    logger.error("Get me error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  // @ts-ignore
  if (req.session) {
    // @ts-ignore
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie("connect.sid");
      logger.info("User logged out");
      return res.json({ message: "Logged out successfully" });
    });
  } else {
    return res.json({ message: "No active session" });
  }
};

export const oauthSuccess = async (req: Request, res: Response) => {
  if (req.user) {
    const user = req.user as any;

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    logger.info(`OAuth login: ${user.email}`);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/dashboard?token=${token}`);
  } else {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/login?error=OAuthFailed`);
  }
};
