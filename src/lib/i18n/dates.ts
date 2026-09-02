import type { Locale } from "./config";

/**
 * Fixed formatter with an explicit time zone: this renders on the server, so it
 * must not depend on the machine the server happens to run on.
 *
 * Accepts a string as well as a Date because anything read back through
 * `unstable_cache` has been through JSON and arrives as an ISO string. Taking
 * only a Date here meant a cached listing threw "Invalid time value".
 */
export function checkedOn(date: Date | string, locale: Locale): string {
  const value = date instanceof Date ? date : new Date(date);

  return new Intl.DateTimeFormat(locale === "ta" ? "ta-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(value);
}
