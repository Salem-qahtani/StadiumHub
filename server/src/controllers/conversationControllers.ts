import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";

async function startConversation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    //organizer rules :
    if (userRole === "organizer") {
      const { ownerId } = req.body;
      if (typeof ownerId !== "number") {
        return res.status(400).json({ error: "ownerId required" });
      }
      //check the reciver exist and is owner
      const owner = await prisma.user.findUnique({
        where: { id: ownerId },
      });
      if (!owner || owner.role !== "owner") {
        return res.status(400).json({ error: "you can only message owners" });
      }
      // get existing conversation or create it (atomic, race-safe)
      const conversation = await prisma.conversation.upsert({
        where: {
          organizerId_ownerId: {
            organizerId: userId!,
            ownerId: ownerId,
          },
        },
        update: {},
        create: {
          organizerId: userId!,
          ownerId: ownerId,
        },
        include: { owner: { select: { name: true, username: true } } },
      });
      return res.status(200).json(conversation);
    } //owner rules :
    else if (userRole === "owner") {
      const { organizerId } = req.body;
      if (typeof organizerId !== "number") {
        return res.status(400).json({ error: "organizerId required" });
      }
      //check the reciver exist and is organizer
      const organizer = await prisma.user.findUnique({
        where: { id: organizerId },
      });
      if (!organizer || organizer.role !== "organizer") {
        return res
          .status(400)
          .json({ error: "you can only message organizers" });
      }
      // find existing conversation
      const exist = await prisma.conversation.findUnique({
        where: {
          organizerId_ownerId: {
            organizerId: organizerId,
            ownerId: userId!,
          },
        },
        include: { organizer: { select: { name: true, username: true } } },
      });
      if (exist) {
        return res.json(exist);
      }
      const owner = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          stadiums: {
            include: {
              slots: {
                include: {
                  reservations: true,
                },
              },
            },
          },
        },
      });
      //check if the organizer have a reservation with the owner
      function hasReservation() {
        const stadiums = owner!.stadiums;
        const slots = stadiums.flatMap((stadium) => {
          return stadium.slots;
        });
        const reservations = slots.flatMap((slot) => {
          return slot.reservations;
        });
        return reservations.some((reservation) => {
          return reservation.organizerId === organizerId;
        });
      }
      if (!hasReservation()) {
        return res
          .status(403)
          .json({ error: "you can only message organizers with reservations" });
      }
      const conversation = await prisma.conversation.upsert({
        where: {
          organizerId_ownerId: {
            organizerId: organizerId,
            ownerId: userId!,
          },
        },
        update: {},
        create: {
          organizerId: organizerId,
          ownerId: userId!,
        },
        include: { organizer: { select: { name: true, username: true } } },
      });
      return res.status(200).json(conversation);
    } // user role is not organizer or owner
    else {
      return res.status(400).json({ error: "invalid role" });
    }
  } catch (error) {
    next(error);
  }
}

// GET /api/conversations
// inbox list for the logged-in user
async function getMyConversations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.userId;
    const userRole = req.userRole;
    if (userRole === "owner") {
      const conversations = await prisma.conversation.findMany({
        where: { ownerId: userId, messages: { some: {} } },
        include: {
          organizer: { select: { name: true, username: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
      return res.json(conversations);
    } else if (userRole === "organizer") {
      const conversations = await prisma.conversation.findMany({
        where: { organizerId: userId, messages: { some: {} } },
        include: {
          owner: { select: { name: true, username: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
      return res.json(conversations);
    } else {
      return res.status(403).json({ error: "invalid role" });
    }
  } catch (error) {
    next(error);
  }
}

export { startConversation, getMyConversations };
