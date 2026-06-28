import { Request, Response, NextFunction } from "express";
import cloudinary from "../lib/cloudinary.js";

async function uploadImages(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    const urls = await Promise.all(
      files.map(async (file) => {
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: "stadiums", // group all stadium photos under one Cloudinary folder
        });
        return result.secure_url;
      }),
    );

    return res.status(201).json({ urls });
  } catch (error) {
    next(error);
  }
}

export { uploadImages };
