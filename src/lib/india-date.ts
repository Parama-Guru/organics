const INDIA_OFFSET_MINUTES = 330;
const INDIA_OFFSET_MS = INDIA_OFFSET_MINUTES * 60_000;

/** Current calendar date in India, independent of the server's time zone. */
export function indiaDateInputValue(date = new Date()): string {
  return new Date(date.getTime() + INDIA_OFFSET_MS).toISOString().slice(0, 10);
}

/** Parse a date input as the start of that calendar day in India. */
export function startOfIndiaDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00+05:30`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Parse an inclusive date input as the end of that calendar day in India. */
export function endOfIndiaDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T23:59:59.999+05:30`);
  return Number.isNaN(date.getTime()) ? null : date;
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
