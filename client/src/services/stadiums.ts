import api from "./api";
import type { Stadium } from "../types";

type StadiumInput = {
  name: string;
  location: string;
  description: string;
  images?: string[];
};

// Organizer browse (optionally filtered by name/location).
export async function getStadiums(search?: string): Promise<Stadium[]> {
  const { data } = await api.get<Stadium[]>("/stadiums", {
    params: search ? { search } : undefined,
  });
  return data;
}

// Owner's own stadiums.
export async function getOwnerStadiums(): Promise<Stadium[]> {
  const { data } = await api.get<Stadium[]>("/stadiums/owner");
  return data;
}

export async function getStadium(id: number): Promise<Stadium> {
  const { data } = await api.get<Stadium>(`/stadiums/${id}`);
  return data;
}

export async function createStadium(input: StadiumInput): Promise<Stadium> {
  const { data } = await api.post<{ message: string; stadium: Stadium }>(
    "/stadiums",
    input,
  );
  return data.stadium;
}

export async function updateStadium(
  id: number,
  input: Partial<StadiumInput>,
): Promise<Stadium> {
  const { data } = await api.put<Stadium>(`/stadiums/${id}`, input);
  return data;
}

export async function deleteStadium(id: number): Promise<void> {
  await api.delete(`/stadiums/${id}`);
}
