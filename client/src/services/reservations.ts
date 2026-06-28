import api from "./api";
import type { Reservation } from "../types";

// Organizer books a slot. Throws on 409 when the slot was just taken.
export async function createReservation(
  slotId: number,
): Promise<Reservation> {
  const { data } = await api.post<{ message: string; reservation: Reservation }>(
    "/reservations",
    { slotId },
  );
  return data.reservation;
}

// Organizer's reservations (includes slot + stadium).
export async function getMyReservations(): Promise<Reservation[]> {
  const { data } = await api.get<Reservation[]>("/reservations/me");
  return data;
}

// Owner's incoming reservations (includes slot + stadium + organizer).
export async function getOwnerReservations(): Promise<Reservation[]> {
  const { data } = await api.get<Reservation[]>("/reservations/owner");
  return data;
}

export async function cancelReservation(id: number): Promise<Reservation> {
  const { data } = await api.patch<{ message: string; reservation: Reservation }>(
    `/reservations/${id}/cancel`,
  );
  return data.reservation;
}
