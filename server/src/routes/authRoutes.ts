import { Router } from "express";
import rateLimit from "express-rate-limit";
import { signup, signin } from "../controllers/authController.js";

const router = Router();

// Throttle auth attempts per IP to blunt credential brute-forcing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later." },
});

router.post("/signup", authLimiter, signup);
router.post("/signin", authLimiter, signin);

export default router;
