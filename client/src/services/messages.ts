import api from "./api";
import type { Message } from "../types";

// Latest 50 messages, oldest -> newest.
export async function getMessages(conversationId: number): Promise<Message[]> {
  const { data } = await api.get<Message[]>(
    `/conversations/${conversationId}/messages`,
  );
  return data;
}

export async function sendMessage(
  conversationId: number,
  content: string,
): Promise<Message> {
  const { data } = await api.post<Message>(
    `/conversations/${conversationId}/messages`,
    { content },
  );
  return data;
}

export async function markAsRead(conversationId: number): Promise<void> {
  await api.patch(`/conversations/${conversationId}/read`);
}
