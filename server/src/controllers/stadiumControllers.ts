import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";

const FIELD_LIMITS = { name: 100, location: 120, description: 2000 } as const;

// Returns the name of the first field that exceeds its max length, or null.
function tooLongField(fields: {
  name?: unknown;
  location?: unknown;
  description?: unknown;
}): keyof typeof FIELD_LIMITS | null {
  for (const key of ["name", "location", "description"] as const) {
    const value = fields[key];
    if (typeof value === "string" && value.trim().length > FIELD_LIMITS[key]) {
      return key;
    }
  }
  return null;
}

function hasInvalidImages(images: unknown): boolean {
  if (images === undefined) return false;
  return (
    !Array.isArray(images) ||
    !images.every(
      (url) =>
        typeof url === "string" &&
        url.startsWith("https://res.cloudinary.com/"),
    )
  );
}

async function createStadium(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, location, description, images } = req.body;
    const ownerId = req.userId;

    if (!ownerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.userRole !== "owner") {
      return res.status(403).json({ error: "Only owners can add stadiums" });
    }
    if (!name?.trim() || !location?.trim() || !description?.trim()) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const longField = tooLongField({ name, location, description });
    if (longField) {
      return res.status(400).json({
        error: `${longField} must be at most ${FIELD_LIMITS[longField]} characters`,
      });
    }
    if (hasInvalidImages(images)) {
      return res
        .status(400)
        .json({ error: "images must be an array of Cloudinary URLs" });
    }

    const stadium = await prisma.stadium.create({
      // store the same trimmed value that was length-checked, so whitespace
      // padding can't slip past the limit measured on `value.trim()`.
      data: {
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
        images: images ?? [],
        ownerId,
      },
    });
    return res.status(201).json({ message: "Stadium created", stadium });
  } catch (error) {
    next(error);
  }
}

async function getStadiums(req: Request, res: Response, next: NextFunction) {
  try {
    // req.query.search can be a string, array, or object — only treat a real
    // string as a search term so a crafted ?search[]=… can't reach Prisma.
    const raw = req.query.search;
    const search = typeof raw === "string" ? raw.trim() : undefined;

    const stadiums = await prisma.stadium.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      include: { owner: { select: { username: true } } },
    });
    return res.json(stadiums);
  } catch (error) {
    next(error);
  }
}

async function getOwnerStadiums(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (req.userRole !== "owner") {
      return res.status(403).json({ error: "unauthrized access" });
    }
    const stadiums = await prisma.stadium.findMany({
      where: { ownerId: req.userId },
    });
    res.json(stadiums);
  } catch (error) {
    next(error);
  }
}

async function getStadium(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const stadium = await prisma.stadium.findUnique({
      where: { id: id },
    });

    if (!stadium) {
      return res.status(404).json({ error: "Stadium not found" });
    }
    return res.json(stadium);
  } catch (error) {
    next(error);
  }
}

async function updateStadium(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const stadium = await prisma.stadium.findUnique({
      where: { id: id },
    });
    if (!stadium) {
      return res.status(404).json({ error: "stadium not found" });
    }
    //check for authrization
    const userId = req.userId;
    if (userId !== stadium.ownerId) {
      return res.status(403).json({ error: "You can only edit your stadiums" });
    }

    const { name, location, description, images } = req.body;

    // A provided field must be a non-empty string; reject blanks rather than
    // silently falling back to the old value (which `||` used to do).
    if (
      (name !== undefined && !String(name).trim()) ||
      (location !== undefined && !String(location).trim()) ||
      (description !== undefined && !String(description).trim())
    ) {
      return res.status(400).json({ error: "fields cannot be empty" });
    }
    const longField = tooLongField({ name, location, description });
    if (longField) {
      return res.status(400).json({
        error: `${longField} must be at most ${FIELD_LIMITS[longField]} characters`,
      });
    }
    if (hasInvalidImages(images)) {
      return res
        .status(400)
        .json({ error: "images must be an array of Cloudinary URLs" });
    }
    const updated = await prisma.stadium.update({
      where: { id: stadium.id },
      // only updates name, location, description, images — not the whole req.body.
      // `?? old` leaves a field unchanged only when it's omitted (undefined);
      // images is replaced wholesale when provided.
      data: {
        name: (name ?? stadium.name).trim(),
        location: (location ?? stadium.location).trim(),
        description: (description ?? stadium.description).trim(),
        images: images === undefined ? stadium.images : images,
      },
    });
    return res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteStadium(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const stadium = await prisma.stadium.findUnique({
      where: { id: id },
    });

    if (!stadium) {
      return res.status(404).json({ error: "stadium not found" });
    }
    //check for authrization
    const userId = req.userId;
    if (userId !== stadium.ownerId) {
      return res
        .status(403)
        .json({ error: "You can only delete your stadiums" });
    }

    await prisma.stadium.delete({
      where: { id: stadium.id },
    });
    return res.json({ message: "stadium deleted", stadium });
  } catch (error) {
    next(error);
  }
}

export {
  createStadium,
  getStadiums,
  getOwnerStadiums,
  getStadium,
  updateStadium,
  deleteStadium,
};
