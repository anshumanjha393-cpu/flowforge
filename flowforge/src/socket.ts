import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5001");

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.log("Connect Error:", err.message);
});