import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import helmet from "helmet";
import authRoutes from "./routes/authroutes.js";
import taskroutes from "./routes/taskroutes.js";
import userRoutes from "./routes/userroutes.js";
import projectroutes from "./routes/projectroutes.js";
import activityroutes from "./routes/activityroutes.js";
import commentRoutes from "./routes/commentroutes.js";
import attachmentRoutes from "./routes/attachmentroutes.js";
import workspaceRoutes from "./routes/workspaceroutes.js";
import sprintRoutes from "./routes/spintroutes.js";
import timeEntryRoutes from "./routes/timeentryroutes.js";
import webhookRoutes from "./routes/webhookroutes.js";
import auditLogRoutes from "./routes/auditlogroutes.js";
import boardShareRoutes from "./routes/boardshareroutes.js";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { getSessionMiddleware } from "./config/session.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./config/logger.js";
import { swaggerSpec } from "./config/swagger.js";
import swaggerUi from "swagger-ui-express";
import { prisma } from "./config/prisma.js";
import path from "path";

process.on("uncaughtException", (err) => {
  logger.error("CRASH:", err.message, err.stack);
});

process.on("unhandledRejection", (reason: unknown) => {
  const err = reason as Error;
  logger.error("UNHANDLED REJECTION:", err?.message ?? reason);
});

dotenv.config();

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(getSessionMiddleware());

app.use(passport.initialize());
app.use(passport.session());

// Serve uploaded files
app.use("/uploads", express.static(path.resolve("uploads")));

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "FlowForge API Documentation",
}));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 database:
 *                   type: string
 *                   example: connected
 */
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
    });
  } catch {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "disconnected",
    });
  }
});

app.use("/api/auth", rateLimiter, authRoutes);
app.use("/api/tasks", taskroutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectroutes);
app.use("/api/activities", activityroutes);
app.use("/api/tasks", commentRoutes);
app.use("/api/tasks", attachmentRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/time-entries", timeEntryRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/board-shares", boardShareRoutes);

app.get("/", (_req, res) => {
  res.send("FlowForge API running");
});

// Error handler middleware (must be after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on("joinProject", (projectId: string) => {
    socket.join(`project:${projectId}`);
    logger.info(`Socket ${socket.id} joined project:${projectId}`);
  });

  socket.on("leaveProject", (projectId: string) => {
    socket.leave(`project:${projectId}`);
    logger.info(`Socket ${socket.id} left project:${projectId}`);
  });

  socket.on("tasksChanged", (projectId?: string) => {
    if (projectId) {
      io.to(`project:${projectId}`).emit("tasksChanged");
      io.to(`project:${projectId}`).emit("activitiesChanged");
    } else {
      io.emit("tasksChanged");
      io.emit("activitiesChanged");
    }
  });

  socket.on("taskMoved", (data) => {
    logger.info(`Task moved: ${data}`);
    io.emit("taskUpdated", data);
    io.emit("tasksChanged");
    io.emit("activitiesChanged");
  });

  socket.on("commentAdded", (data: { taskId: string; projectId?: string }) => {
    if (data.projectId) {
      io.to(`project:${data.projectId}`).emit("commentAdded", data);
    }
    io.emit("commentAdded", data);
  });

  socket.on("attachmentUploaded", (data: { taskId: string; projectId?: string }) => {
    if (data.projectId) {
      io.to(`project:${data.projectId}`).emit("attachmentUploaded", data);
    }
    io.emit("attachmentUploaded", data);
  });

  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API Documentation: ${backendUrl}/api-docs`);
  logger.info(`Health Check: ${backendUrl}/health`);
});
