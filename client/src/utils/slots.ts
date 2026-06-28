import type { Slot } from "../types";

// Sort slots chronologically: by date, then start time.
export function sortSlots(slots: Slot[]): Slot[] {
  return [...slots].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    return byDate !== 0 ? byDate : a.startTime.localeCompare(b.startTime);
  });
}
