import { Router } from "express";
import {
  createSlot,
  getSlots,
  getOwnerSlots,
  updateSlotStatus,
  deleteSlot,
} from "../controllers/slotControllers.js";
import protect from "../middlewares/protect.js";

const router = Router();

router.get("/:stadiumId/slots", protect, getSlots);
router.get("/:stadiumId/slots/owner", protect, getOwnerSlots);
router.post("/:stadiumId/slots", protect, createSlot);
router.put("/:stadiumId/slots/:slotId", protect, updateSlotStatus);
router.delete("/:stadiumId/slots/:slotId", protect, deleteSlot);

export default router;
