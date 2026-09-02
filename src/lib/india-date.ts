const INDIA_OFFSET_MINUTES = 330;
const INDIA_OFFSET_MS = INDIA_OFFSET_MINUTES * 60_000;

/** Current calendar date in India, independent of the server's time zone. */
export function indiaDateInputValue(date = new Date()): string {
  return new Date(date.getTime() + INDIA_OFFSET_MS).toISOString().slice(0, 10);
}

function parseIndiaDate(value: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${time}+05:30`);
  if (Number.isNaN(date.getTime())) return null;
  // Date accepts values such as 2026-02-30 and silently moves them into March.
  // Round-tripping through the business timezone catches that normalization.
  return indiaDateInputValue(date) === value ? date : null;
}

/** Parse a date input as the start of that calendar day in India. */
export function startOfIndiaDate(value: string): Date | null {
  return parseIndiaDate(value, "00:00:00.000");
}

/** Parse an inclusive date input as the end of that calendar day in India. */
export function endOfIndiaDate(value: string): Date | null {
  return parseIndiaDate(value, "23:59:59.999");
}

export function formatIndiaDate(date: Date, locale: "ta" | "en"): string {
  return new Intl.DateTimeFormat(locale === "ta" ? "ta-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function indiaDateKey(date: Date): string {
  return indiaDateInputValue(date);
}
