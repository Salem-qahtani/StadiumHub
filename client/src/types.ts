// Shared domain types — mirror the server's Prisma models and API responses.

export type Role = "owner" | "organizer";

export type Stadium = {
  id: number;
  name: string;
  description: string;
  location: string;
  images: string[];
  ownerId: number;
  // included on GET /stadiums (organizer browse)
  owner?: { username: string };
};

export type Slot = {
  id: number;
  stadiumId: number;
  date: string; // ISO date string
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  available: boolean;
};

export type ReservationStatus = "confirmed" | "cancelled";

export type Reservation = {
  id: number;
  slotId: number;
  organizerId: number;
  status: ReservationStatus;
  createdAt: string;
  // included on /reservations/me and /reservations/owner
  slot?: Slot & { stadium?: Stadium };
  organizer?: { id: number; name: string; username: string };
};

export type Message = {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  read: boolean;
  createdAt: string;
};

export type ConversationParticipant = {
  name: string;
  username: string;
};

export type Conversation = {
  id: number;
  organizerId: number;
  ownerId: number;
  createdAt: string;
  // included on GET /conversations
  organizer?: ConversationParticipant;
  owner?: ConversationParticipant;
  messages?: Message[]; // most recent message only (take: 1)
};
