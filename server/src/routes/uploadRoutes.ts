import { Router } from "express";
import protect from "../middlewares/protect.js";
import { requireOwner, handleUpload } from "../middlewares/uploadImages.js";
import { uploadImages } from "../controllers/uploadControllers.js";

const router = Router();

router.post("/", protect, requireOwner, handleUpload, uploadImages);

export default router;
