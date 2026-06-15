import express from "express";
import dotenv from "dotenv";
import cors from "cors"
import authRoutes from "./routes/authroutes.js";
import taskroutes from "./routes/taskroutes.js";
import { createServer } from "node:http";
import { Server } from "socket.io";
process.on("uncaughtException", (err) => {
  console.error("💥 CRASH:", err.message, err.stack);
});

process.on("unhandledRejection", (reason: any) => {
  console.error("💥 UNHANDLED REJECTION:", reason?.message ?? reason);
});


// Add at the top of server.ts, after imports
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
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

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskroutes);

app.get("/", (req, res) => {
  res.send("FlowForge API running");
});

const PORT = 5001;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
 // server.ts
socket.on("tasksChanged", () => {
  io.emit("tasksChanged"); // ← broadcast instead of io.emit
});

  socket.on("taskMoved", (data) => {
    console.log("Task moved:", data);

    io.emit("taskUpdated", data);
    io.emit("tasksChanged")
  });

  
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});