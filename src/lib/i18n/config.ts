export const LOCALES = ["ta", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** Tamil is the default: this is a Tamil Nadu farm directory first. */
export const DEFAULT_LOCALE: Locale = "ta";

/**
 * The locales the site actually serves. Tamil is the DEFAULT — a visitor with
 * no stored choice lands on /ta — but English stays reachable through the
 * header toggle. Removing "en" here disables it everywhere and hides the
 * toggle; nothing else needs to change either way.
 */
export const ENABLED_LOCALES: readonly Locale[] = ["ta", "en"];

export function isEnabledLocale(value: unknown): value is Locale {
  return isLocale(value) && ENABLED_LOCALES.includes(value);
}

/**
 * Language for routes that carry no `[lang]` segment — the seller and staff
 * sign-in pages. An explicit choice wins, then the remembered site language,
 * then Tamil. Kept here so the toggle, the pages and the tests agree.
 */
export function resolveLocalePreference(explicit: unknown, remembered: unknown): Locale {
  if (isEnabledLocale(explicit)) return explicit;
  if (isEnabledLocale(remembered)) return remembered;
  return DEFAULT_LOCALE;
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
