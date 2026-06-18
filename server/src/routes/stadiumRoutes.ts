import { Router } from "express";
import {
  createStadium,
  getStadiums,
  getStadium,
  updateStadium,
  deleteStadium,
} from "../controllers/stadiumControllers.js";
import protect from "../middlewares/protect.js";

const router = Router();

router.get("/", getStadiums);
router.get("/:id", getStadium);
router.post("/", protect, createStadium);
router.put("/:id", protect, updateStadium);
router.delete("/:id", protect, deleteStadium);

export default router;
