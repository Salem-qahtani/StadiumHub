import api from "./api";
import type { Conversation } from "../types";

// Start (or fetch the existing) conversation.
// Organizers pass an ownerId; owners pass an organizerId.
export async function startConversation(
  target: { ownerId: number } | { organizerId: number },
): Promise<Conversation> {
  const { data } = await api.post<Conversation>("/conversations", target);
  return data;
}

// Inbox for the logged-in user (includes the other participant + last message).
export async function getMyConversations(): Promise<Conversation[]> {
  const { data } = await api.get<Conversation[]>("/conversations");
  return data;
}
