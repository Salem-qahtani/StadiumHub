import { Request, Response, NextFunction } from "express";
import multer from "multer";

//   - fileSize: 5MB max per image
//   - files:    6 images max per request
// And fileFilter rejects anything that isn't an image/* mimetype.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true); // accept
    } else {
      cb(new Error("Only image files are allowed")); // reject with a message
    }
  },
});

export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== "owner") {
    return res.status(403).json({ error: "Only owners can upload images" });
  }
  next();
}

export function handleUpload(req: Request, res: Response, next: NextFunction) {
  upload.array("images", 6)(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      // multer's built-in limit violations (size / count) come through here
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Each image must be under 5MB"
          : err.code === "LIMIT_FILE_COUNT"
            ? "You can upload up to 6 images"
            : err.message;
      return res.status(400).json({ error: message });
    }
    if (err instanceof Error) {
      //fileFilter rejection ("Only image files are allowed")
      return res.status(400).json({ error: err.message });
    }
    next(); // no error → continue to the controller
  });
}
