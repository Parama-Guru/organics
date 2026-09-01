export const LOCALES = ["ta", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** Tamil is the default: this is a Tamil Nadu farm directory first. */
export const DEFAULT_LOCALE: Locale = "ta";

/**
 * The locales the site actually serves. English is written and kept in the
 * repo but not offered: a request for /en is redirected to Tamil and the
 * language toggle does not render. Add "en" back here to turn it on again —
 * nothing else needs to change.
 */
export const ENABLED_LOCALES: readonly Locale[] = ["ta"];

export function isEnabledLocale(value: unknown): value is Locale {
  return isLocale(value) && ENABLED_LOCALES.includes(value);
}

/** Read by the proxy to keep an explicit choice sticky across visits. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_NAMES: Record<Locale, string> = {
  ta: "தமிழ்",
  en: "English",
};

/** Short form for the header toggle, where horizontal space is scarce. */
export const LOCALE_SHORT: Record<Locale, string> = {
  ta: "தமிழ்",
  en: "EN",
};

/** BCP 47 tags for the <html lang> attribute. */
export const HTML_LANG: Record<Locale, string> = {
  ta: "ta-IN",
  en: "en-IN",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Prefix an app-relative path with a locale: ("ta", "/products") -> "/ta/products". */
export function localePath(locale: Locale, path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/**
 * Only same-site absolute paths are accepted back, so `?next=` cannot be used
 * to bounce someone to another host after they sign in.
 */
export function safeNext(value: string | undefined, locale: Locale): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value.startsWith(`/${locale}/`) || value === `/${locale}` ? value : null;
}

/** Swap the locale segment of a full pathname, keeping the rest of the route. */
export function withLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  // segments[0] is "" because pathname always starts with "/".
  if (isLocale(segments[1])) {
    segments[1] = locale;
    return segments.join("/");
  }
  return localePath(locale, pathname);
}

/** Fill {name} placeholders. Dictionaries stay plain strings so they can cross to the client. */
export function format(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
