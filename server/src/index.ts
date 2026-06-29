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

if (!process.env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL is not set");
}

const app = express();
const server = createServer(app);
const io = initSocket(server);

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

// TEMP (remove after deploy): inspect the proxy chain to pick `trust proxy`.
// Hit https://<your-app>/api/_ip and read `xForwardedFor`:
//   - it's an ordered list, client-first: "<realClientIP>, <proxy1>, <proxy2>".
//   - the number of proxy IPs your infra added = the `trust proxy` value.
//   - with `trust proxy` set correctly, `ip` should equal your real public IP.
app.get("/api/_ip", (req, res) => {
  res.json({
    ip: req.ip,
    xForwardedFor: req.headers["x-forwarded-for"] ?? null,
  });
});

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
