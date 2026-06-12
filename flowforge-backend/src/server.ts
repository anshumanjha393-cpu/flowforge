import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authroutes.js";
import taskroutes from "./routes/taskroutes.js";
import { createServer } from "node:http";
import { Server } from "socket.io";

dotenv.config();

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskroutes);

app.get("/", (req, res) => {
  res.send("FlowForge API running");
});

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("taskMoved", (data) => {
    console.log("Task moved:", data);

    io.emit("taskUpdated", data);
  });

  
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});