import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";

async function createReservation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (req.userRole !== "organizer") {
      return res.status(403).json({ error: "only organizers can book slots" });
    }
    const slotId = parseInt(req.body.slotId as string);
    if (isNaN(slotId)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
    });
    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }
    // atomic claim + create in one transaction:
    // transaction rolls the claim back if the create fails
    const reservation = await prisma.$transaction(async (tx) => {
      const claimed = await tx.slot.updateMany({
        where: { id: slotId, available: true },
        data: { available: false },
      });
      if (claimed.count === 0) {
        return null;
      }
      return tx.reservation.create({
        data: {
          slotId,
          organizerId: req.userId!,
          status: "confirmed",
        },
      });
    });
    if (!reservation) {
      return res.status(409).json({ error: "Slot no longer available" });
    }
    return res
      .status(201)
      .json({ message: "reservation created", reservation });
  } catch (error) {
    next(error);
  }
}

async function getMyReservations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { organizerId: req.userId },
      include: {
        slot: { include: { stadium: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(reservations);
  } catch (error) {
    next(error);
  }
}

async function cancelReservation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const reservation = await prisma.reservation.findUnique({
      where: { id: id },
    });
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    if (reservation.organizerId !== req.userId) {
      return res
        .status(403)
        .json({ error: "You can only cancel your reservations" });
    }
    if (reservation.status === "cancelled") {
      return res.status(400).json({ error: "Reservation already cancelled" });
    }

    // cancel + free the slot atomically so we never leave a cancelled
    // reservation with its slot still marked unavailable
    const cancelled = await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id: id },
        data: { status: "cancelled" },
      });
      await tx.slot.update({
        where: { id: reservation.slotId },
        data: { available: true },
      });
      return updated;
    });
    return res.json({
      message: "reservation cancelled",
      reservation: cancelled,
    });
  } catch (error) {
    next(error);
  }
}

async function getOwnerReservations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (req.userRole !== "owner") {
      return res.status(403).json({ error: "unauthrized access" });
    }
    const reservations = await prisma.reservation.findMany({
      where: {
        slot: { stadium: { ownerId: req.userId } },
      },
      include: {
        slot: { include: { stadium: true } },
        organizer: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(reservations);
  } catch (error) {
    next(error);
  }
}

export {
  createReservation,
  getMyReservations,
  cancelReservation,
  getOwnerReservations,
};
