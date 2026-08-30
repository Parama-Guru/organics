import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BasketIcon } from "@/components/ui/icons";
import { localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

/**
 * Without this, a stale or mistyped listing URL renders Next's bare default —
 * no header, no nav, no language — which drops the visitor out of the site
 * entirely rather than back into it.
 */
export default async function NotFound() {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <BasketIcon className="mx-auto text-5xl text-bark-200" />
      <p className="mt-4 font-display text-sm text-marigold-600">404</p>
      <h1 className="mt-1 font-display text-3xl sm:text-4xl">{t.notFound.heading}</h1>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-ink">{t.notFound.body}</p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button as={Link} href={localePath(locale, "/products")} size="lg">
          {t.notFound.browse}
        </Button>
        <Button as={Link} href={localePath(locale, "/")} size="lg" variant="secondary">
          {t.nav.home}
        </Button>
      </div>
    </div>
  );
}
