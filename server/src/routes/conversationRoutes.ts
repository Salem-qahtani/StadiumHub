import { Router } from "express";
import {
  startConversation,
  getMyConversations,
} from "../controllers/conversationControllers.js";
import protect from "../middlewares/protect.js";

const router = Router();

router.post("/", protect, startConversation);
router.get("/", protect, getMyConversations);

export default router;
