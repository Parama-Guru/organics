"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useOptionalI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/dictionaries/en";

/**
 * Shown when a page throws — in practice almost always a dropped database
 * connection. Previously that surfaced as a bare 500 with no way forward.
 *
 * `reset` re-renders the segment without a full page load, which is exactly
 * right for a transient fault.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const i18n = useOptionalI18n();
  const t = i18n?.t ?? en;
  const locale = i18n?.locale ?? "en";

  useEffect(() => {
    // The digest is all the server gives the browser; logging it here is what
    // lets a report from a visitor be matched to a line in the server log.
    console.error("[page]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start px-4 py-20 sm:px-6 sm:py-28">
      <p className="section-kicker">{t.failure.heading}</p>
      <h1 className="editorial-heading mt-6">{t.failure.heading}</h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-bark-600">{t.failure.body}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button type="button" onClick={reset} size="lg">
          {t.failure.retry}
        </Button>
        <Button as={Link} href={localePath(locale, "/")} variant="secondary" size="lg">
          {t.failure.home}
        </Button>
        <Button as={Link} href={localePath(locale, "/contact")} variant="ghost" size="lg">
          {t.failure.contact}
        </Button>
      </div>

      {error.digest ? (
        <p className="rule-label mt-8 text-bark-600">
          {t.failure.reference.replace("{id}", error.digest)}
        </p>
      ) : null}
    </div>
  );
}
