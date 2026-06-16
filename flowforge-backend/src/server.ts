import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import authRoutes from "./routes/authroutes.js";
import taskroutes from "./routes/taskroutes.js";
import userRoutes from "./routes/userroutes.js";
import projectroutes from "./routes/projectroutes.js";
import activityroutes from "./routes/activityroutes.js";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { getSessionMiddleware } from "./config/session.js";
import { rateLimiter } from "./middleware/rateLimiter.js";

process.on("uncaughtException", (err) => {
  console.error("💥 CRASH:", err.message, err.stack);
});

process.on("unhandledRejection", (reason: any) => {
  console.error("💥 UNHANDLED REJECTION:", reason?.message ?? reason);
});

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(getSessionMiddleware());

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", rateLimiter, authRoutes);
app.use("/api/tasks", taskroutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectroutes);
app.use("/api/activities", activityroutes);

app.get("/", (req, res) => {
  res.send("FlowForge API running");
});

const PORT = 5001;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("tasksChanged", () => {
    io.emit("tasksChanged");
    io.emit("activitiesChanged");
  });

  socket.on("taskMoved", (data) => {
    console.log("Task moved:", data);
    io.emit("taskUpdated", data);
    io.emit("tasksChanged");
    io.emit("activitiesChanged");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});