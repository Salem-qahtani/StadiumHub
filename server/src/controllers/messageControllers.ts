import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";

//helper function
async function getUserConversation(conversationId: number, userId: number) {
  return await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ organizerId: userId }, { ownerId: userId }],
    },
  });
}

async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const conversation = await getUserConversation(
      parseInt(req.params.id as string),
      req.userId!,
    );
    if (!conversation) {
      return res.status(404).json({ error: "conversation not found" });
    }
    // load the latest 50 messages, then flip back to oldest->newest for display
    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return res.json(messages.reverse());
  } catch (error) {
    next(error);
  }
}

async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const conversation = await getUserConversation(
      parseInt(req.params.id as string),
      req.userId!,
    );
    if (!conversation) {
      return res.status(404).json({ error: "conversation not found" });
    }
    const { content } = req.body;
    if (typeof content !== "string") {
      return res.status(400).json({ error: "content must be a string" });
    }

    if (!content.trim()) {
      return res.status(400).json({ error: "mesage cant be empty" });
    }
    if (content.length > 500) {
      return res.status(400).json({ error: "mesage is too long" });
    }
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: req.userId!,
        content: content,
      },
    });
    return res.json(message);
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const conversation = await getUserConversation(
      parseInt(req.params.id as string),
      req.userId!,
    );
    if (!conversation) {
      return res.status(404).json({ error: "conversation not found" });
    }
    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderId: { not: req.userId },
        read: false,
      },
      data: {
        read: true,
      },
    });
    return res.json({ message: "conversation marked as read" });
  } catch (error) {
    next(error);
  }
}

export { getMessages, sendMessage, markAsRead };
