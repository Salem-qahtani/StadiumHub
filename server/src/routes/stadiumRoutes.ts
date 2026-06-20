import { Router } from "express";
import {
  createStadium,
  getStadiums,
  getOwnerStadiums,
  getStadium,
  updateStadium,
  deleteStadium,
} from "../controllers/stadiumControllers.js";
import protect from "../middlewares/protect.js";

const router = Router();

router.get("/", protect, getStadiums);
router.get("/owner", protect, getOwnerStadiums);
router.get("/:id", protect, getStadium);
router.post("/", protect, createStadium);
router.put("/:id", protect, updateStadium);
router.delete("/:id", protect, deleteStadium);

export default router;
