import { Router } from "express";
import {
  createReservation,
  getMyReservations,
  cancelReservation,
  getOwnerReservations,
} from "../controllers/reservationControllers.js";
import protect from "../middlewares/protect.js";

const router = Router();

router.post("/", protect, createReservation);
router.get("/me", protect, getMyReservations);
router.get("/owner", protect, getOwnerReservations);
router.patch("/:id/cancel", protect, cancelReservation);

export default router;
