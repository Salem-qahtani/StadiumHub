import "dotenv/config";

import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import stadiumRoutes from "./routes/stadiumRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

const app = express();
const server = createServer(app);
// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/stadiums", stadiumRoutes);
app.use("/api/stadiums", slotRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/conversations", messageRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});
// global error handeler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`server is running on port : ${PORT}`);
});
