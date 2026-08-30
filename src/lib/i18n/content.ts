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

// Units are free text on the product and mostly "<number> <noun>". Only the noun
// needs translating; leaving "dozen" or "box of 6" fused to a Tamil postposition
// is exactly the mixed-script mess that reads as machine translation.
const UNIT_TA: Record<string, string> = {
  bag: "பை",
  bunch: "கட்டு",
  dozen: "12 எண்",
  each: "ஒன்று",
  pot: "ஜாடி",
  punnet: "கூடை",
  "box of 6": "6 எண் பெட்டி",
  "pack of 3": "3 எண் பொட்டலம்",
};

export function unitLabel(locale: Locale, unit: string): string {
  if (locale !== DEFAULT_LOCALE) return unit;

  const whole = UNIT_TA[unit.toLowerCase()];
  if (whole) return whole;

  // "400 g pot" -> "400 g ஜாடி": keep the measurement, translate the trailing noun.
  const match = unit.match(/^(.*?)\s*([a-z]+)$/i);
  const noun = match?.[2]?.toLowerCase();
  if (match && noun && UNIT_TA[noun]) return `${match[1]} ${UNIT_TA[noun]}`.trim();

  return unit;
}
