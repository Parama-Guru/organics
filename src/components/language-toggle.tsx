"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useI18n } from "@/lib/i18n/client";
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_NAMES,
  LOCALE_SHORT,
  format,
  withLocale,
  type Locale,
} from "@/lib/i18n/config";

// Remembering the choice is what makes a later visit to a bare "/" land in the
// right language; the URL alone only covers the page being clicked.
function remember(locale: Locale) {
  const secure = window.location.protocol === "https:" ? ";secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};samesite=lax${secure}`;
}

export function LanguageToggle() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const query = useSearchParams().toString();

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className="flex shrink-0 items-center rounded-full border border-bark-200 bg-white/70 p-0.5 backdrop-blur"
    >
      {LOCALES.map((target) => {
        const active = target === locale;
        return (
          <Link
            key={target}
            href={`${withLocale(pathname, target)}${query ? `?${query}` : ""}`}
            hrefLang={target}
            aria-current={active ? "true" : undefined}
            aria-label={
              active
                ? LOCALE_NAMES[target]
                : format(t.nav.switchTo, { language: LOCALE_NAMES[target] })
            }
            onClick={() => remember(target)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
              active
                ? "bg-bark-900 text-bark-50"
                : "text-bark-600 hover:bg-bark-900/5 hover:text-bark-900"
            }`}
          >
            {LOCALE_SHORT[target]}
          </Link>
        );
      })}
    </div>
  );
}
