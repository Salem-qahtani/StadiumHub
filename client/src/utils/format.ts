// Format a slot's ISO date string as e.g. "Mon, Jun 30".
export function formatSlotDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// "09:00" + "10:30" -> "09:00 – 10:30"
export function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`;
}
