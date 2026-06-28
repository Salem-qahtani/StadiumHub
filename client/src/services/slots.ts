import api from "./api";
import type { Slot } from "../types";

type SlotInput = {
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
};

// Organizer view: bookable slots for the next 7 days (future only).
export async function getSlots(stadiumId: number): Promise<Slot[]> {
  const { data } = await api.get<Slot[]>(`/stadiums/${stadiumId}/slots`);
  return data;
}

// Owner view: every slot for the stadium.
export async function getOwnerSlots(stadiumId: number): Promise<Slot[]> {
  const { data } = await api.get<Slot[]>(`/stadiums/${stadiumId}/slots/owner`);
  return data;
}

export async function createSlot(
  stadiumId: number,
  input: SlotInput,
): Promise<Slot> {
  const { data } = await api.post<{ message: string; slot: Slot }>(
    `/stadiums/${stadiumId}/slots`,
    input,
  );
  return data.slot;
}

export async function deleteSlot(
  stadiumId: number,
  slotId: number,
): Promise<void> {
  await api.delete(`/stadiums/${stadiumId}/slots/${slotId}`);
}
