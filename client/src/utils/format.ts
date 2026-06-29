// Format a slot's ISO date string as e.g. "Mon, Jun 30".
// `locale` defaults to the system locale; pass "en-US" to force English.
export function formatSlotDate(iso: string, locale?: string): string {
  // ISO date-only values are UTC midnight; read the UTC calendar parts and
  // rebuild a local date so negative-UTC zones don't shift to the day before.
  const d = new Date(iso);
  const local = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return local.toLocaleDateString(locale, {
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

// Compact relative time for chat/inbox previews: "now", "5m", "3h", "2d";
// older than a week falls back to the locale-adaptive date ("Mon, Jun 30").
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return "now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  // Older than a week: show this timestamp's local calendar date. (Not
  // formatSlotDate — that reads UTC parts for date-only slot strings, whereas a
  // message timestamp carries a real time and should display in local time.)
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
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
