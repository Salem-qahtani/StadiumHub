import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";

async function createSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const { date, startTime, endTime } = req.body;
    const stadiumId = parseInt(req.params.stadiumId as string);

    if (req.userRole !== "owner") {
      return res.status(403).json({ error: "only owners can add slots" });
    }
    if (!date?.trim() || !startTime?.trim() || !endTime?.trim()) {
      return res.status(400).json({ error: "all fields are required" });
    }
    if (isNaN(Date.parse(date))) {
      return res.status(400).json({ error: "invalid date" });
    }
    if (startTime >= endTime) {
      return res
        .status(400)
        .json({ error: "startTime must be before endTime" });
    }
    const stadium = await prisma.stadium.findUnique({
      where: { id: stadiumId },
    });

    if (!stadium) {
      return res.status(404).json({ error: "Stadium not found" });
    }

    if (stadium.ownerId !== req.userId) {
      return res.status(403).json({ error: "This is not your stadium" });
    }
    const slot = await prisma.slot.create({
      data: {
        date: new Date(date),
        startTime,
        endTime,
        stadium: { connect: { id: stadiumId } },
      },
    });
    return res.status(201).json({ message: "slot created", slot });
  } catch (error) {
    next(error);
  }
}
async function getSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const stadiumId = parseInt(req.params.stadiumId as string);
    const stadium = await prisma.stadium.findUnique({
      where: { id: stadiumId },
    });
    if (!stadium) {
      return res.status(404).json({ error: "Stadium not found" });
    }
    const today = new Date();

    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);

    const slots = await prisma.slot.findMany({
      where: {
        stadiumId: stadiumId,
        date: { gte: today, lte: in7Days },
      },
    });

    const currentTime = today.toTimeString().slice(0, 5);
    const filtered = slots.filter((slot) => {
      const isToday =
        new Date(slot.date).toDateString() === today.toDateString();
      if (isToday) {
        return slot.startTime > currentTime;
      }
      return true;
    });
    return res.json(filtered);
  } catch (error) {
    next(error);
  }
}
async function getOwnerSlots(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.userRole !== "owner") {
      return res.status(403).json({ error: "unauthrized access" });
    }
    const stadiumId = parseInt(req.params.stadiumId as string);
    const stadium = await prisma.stadium.findUnique({
      where: { id: stadiumId },
    });
    if (!stadium) {
      return res.status(404).json({ error: "Stadium not found" });
    }
    if (stadium.ownerId !== req.userId) {
      return res.status(403).json({ error: "This is not your stadium" });
    }
    const slots = await prisma.slot.findMany({
      where: { stadiumId: stadiumId },
    });
    res.json(slots);
  } catch (error) {
    next(error);
  }
}
async function deleteSlot(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.userRole !== "owner") {
      return res.status(403).json({ error: "unauthrized access" });
    }
    const stadiumId = parseInt(req.params.stadiumId as string);
    const slotId = parseInt(req.params.slotId as string);
    const stadium = await prisma.stadium.findUnique({
      where: { id: stadiumId },
    });
    if (!stadium) {
      return res.status(404).json({ error: "Stadium not found" });
    }
    if (stadium.ownerId !== req.userId) {
      return res.status(403).json({ error: "This is not your stadium" });
    }
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
    });
    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }
    if (slot.stadiumId !== stadiumId) {
      return res
        .status(403)
        .json({ error: "Slot does not belong to this stadium" });
    }
    const deleted = await prisma.slot.delete({
      where: { id: slotId },
    });
    return res.json(deleted);
  } catch (error) {
    next(error);
  }
}
export { createSlot, getSlots, getOwnerSlots, deleteSlot };
