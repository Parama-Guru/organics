import type { Locale } from "./config";

// Fixed formatter with an explicit time zone: this renders on the server, so it
// must not depend on the machine the server happens to run on.
export function checkedOn(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ta" ? "ta-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}
