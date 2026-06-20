import "dotenv/config";

import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import stadiumRoutes from "./routes/stadiumRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/stadiums", stadiumRoutes);
app.use("/api/stadiums", slotRoutes);
app.use("/api/reservations", reservationRoutes);

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
app.listen(PORT, () => {
  console.log(`server is running on port : ${PORT}`);
});
