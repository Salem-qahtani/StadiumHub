import { Router } from "express";
import {
  getMessages,
  sendMessage,
  markAsRead,
} from "../controllers/messageControllers.js";
import protect from "../middlewares/protect.js";

const router = Router();

router.get("/:id/messages", protect, getMessages);
router.post("/:id/messages", protect, sendMessage);
router.patch("/:id/read", protect, markAsRead);

export default router;
