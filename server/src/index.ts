import "dotenv/config";
import { initSocket } from "./socket.js";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import stadiumRoutes from "./routes/stadiumRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import jwt from "jsonwebtoken";
import { getUserConversation } from "./controllers/messageControllers.js";

// Refuse to start without an explicit CORS origin — an unset FRONTEND_URL would
// make both the REST `cors` and the Socket.IO CORS fall back to wildcard (*).
if (!process.env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL is not set");
}

const app = express();
const server = createServer(app);
const io = initSocket(server);

// DEPLOYMENT (Railway): uncomment so express-rate-limit keys on the real client
// IP from X-Forwarded-For instead of Railway's edge proxy IP (otherwise all
// users share one rate-limit bucket). 1 = trust exactly one proxy hop. Never
// use `true` — it lets clients spoof X-Forwarded-For and bypass the limiter.
// app.set("trust proxy", 1);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Not authorized"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ["HS256"],
    }) as {
      id: number;
      username: string;
      role: string;
    };
    socket.data.userId = decoded.id;
    socket.data.username = decoded.username;
    socket.data.userRole = decoded.role;
    next();
  } catch (error) {
    next(new Error("Not authorized"));
  }
});
io.on("connection", (socket) => {
  console.log(`user is connected on socket${socket.data.userId}`);

  socket.on("joinConversation", async (conversationId: number) => {
    // Untrusted client input — validate and never let a rejected promise
    // bubble up to an unhandled rejection (which would crash the process).
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return;
    }
    try {
      const conversation = await getUserConversation(
        conversationId,
        socket.data.userId,
      );
      if (!conversation) {
        return;
      }
      socket.join(`conversation:${conversationId}`);
    } catch (error) {
      console.error("joinConversation failed:", error);
    }
  });
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.data.userId}`);
  });
});
// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL }));

// Site-wide throttle per IP — generous so normal browsing isn't affected; only
// catches gross abuse/scraping. The stricter authLimiter stacks on top of /auth.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down and try again." },
});
app.use(globalLimiter);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/stadiums", stadiumRoutes);
app.use("/api/stadiums", slotRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/conversations", messageRoutes);
app.use("/api/uploads", uploadRoutes);

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
