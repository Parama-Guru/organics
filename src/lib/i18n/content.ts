import { DEFAULT_LOCALE, type Locale } from "./config";

/**
 * Picks the Tamil column when it is filled, otherwise the English one. A farm can
 * add a listing without supplying Tamil and it still reads sensibly, rather than
 * leaving a hole in the page.
 */
export function localised(
  locale: Locale,
  base: string,
  tamil: string | null | undefined,
): string {
  return locale === "ta" && tamil ? tamil : base;
}

export function localisedOrNull(
  locale: Locale,
  base: string | null,
  tamil: string | null | undefined,
): string | null {
  return locale === "ta" && tamil ? tamil : base;
}

// Regions are free text on the product, and the English spelling is the value
// carried in the ?region= query string. Only the label is translated, so a filter
// link keeps working and stays shareable across languages.
const REGION_TA: Record<string, string> = {
  Nilgiris: "நீலகிரி",
  Thanjavur: "தஞ்சாவூர்",
  Erode: "ஈரோடு",
  Coorg: "குடகு",
  Ratnagiri: "ரத்னகிரி",
  Himachal: "இமாசலம்",
};

export function regionLabel(locale: Locale, region: string): string {
  if (locale === DEFAULT_LOCALE) return REGION_TA[region] ?? region;
  return region;
}
