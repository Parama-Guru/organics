import { setPortalLanguageAction } from "@/app/portal-language-actions";
import {
  ENABLED_LOCALES,
  LOCALE_NAMES,
  LOCALE_SHORT,
  format,
  type Locale,
} from "@/lib/i18n/config";

export function PortalLanguageToggle({
  locale,
  returnTo,
  label,
  switchTo,
}: {
  locale: Locale;
  returnTo: "/pannai/sign-in" | "/kadai/sign-in" | "/tj/login";
  label: string;
  switchTo: string;
}) {
  if (ENABLED_LOCALES.length < 2) return null;

  return (
    <div
      role="group"
      aria-label={label}
      className="flex shrink-0 items-center rounded-full border border-bark-200 bg-paper/70 p-0.5 shadow-soft"
    >
      {ENABLED_LOCALES.map((target) => {
        const active = target === locale;
        return (
          <form key={target} action={setPortalLanguageAction.bind(null, target, returnTo)}>
            <button
              type="submit"
              aria-pressed={active}
              aria-label={
                active
                  ? LOCALE_NAMES[target]
                  : format(switchTo, { language: LOCALE_NAMES[target] })
              }
              className={`flex min-h-11 min-w-11 items-center justify-center rounded-full px-2.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-inverse text-bark-50"
                  : "text-bark-600 hover:bg-bark-900/5 hover:text-bark-900"
              }`}
            >
              {LOCALE_SHORT[target]}
            </button>
          </form>
        );
      })}
    </div>
  );
}
