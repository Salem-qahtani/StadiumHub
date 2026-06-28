// Format a slot's ISO date string as e.g. "Mon, Jun 30".
// `locale` defaults to the system locale; pass "en-US" to force English.
export function formatSlotDate(iso: string, locale?: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// Format a "HH:MM" 24h string as a locale-aware 12h time, e.g. "6:00 PM".
// Locale stays adaptive (matches formatSlotDate) but the clock is always 12h.
// Pass "en-US" to force English.
export function formatTime(time: string, locale?: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// "09:00" + "10:30" -> "9:00 AM – 10:30 AM"
export function formatTimeRange(
  start: string,
  end: string,
  locale?: string,
): string {
  return `${formatTime(start, locale)} – ${formatTime(end, locale)}`;
}
