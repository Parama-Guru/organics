"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PortalLanguageToggle } from "@/components/portal-language-toggle";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import type { Locale } from "@/lib/i18n/config";
import type { PortalCopy } from "@/lib/i18n/portal-copy";

export function AdminLoginForm({ locale, copy }: { locale: Locale; copy: PortalCopy }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const messages: Record<string, string> = {
    bad_passphrase: copy.adminBadPassphrase,
    rate_limited: copy.errorRateLimited,
    forbidden_origin: copy.adminBlocked,
    invalid_fields: copy.errorInvalid,
    not_found: copy.adminMissing,
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const passphrase = new FormData(event.currentTarget).get("passphrase");
    try {
      const response = await fetch("/api/tj/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passphrase }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setError(messages[result.code] ?? copy.adminBadPassphrase);
        return;
      }
      router.replace("/tj");
      router.refresh();
    } catch {
      setError(copy.adminNetwork);
    } finally {
      setBusy(false);
    }
  }

  return (
    // The toggle submits its own form, so it has to sit beside this one rather
    // than inside it: a nested <form> is invalid HTML and breaks hydration.
    <div lang={locale} className="mx-auto mt-16 max-w-sm">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-2xl text-bark-900">{copy.adminTitle}</h1>
        <PortalLanguageToggle
          locale={locale}
          returnTo="/tj/login"
          label={copy.language}
          switchTo={copy.switchTo}
        />
      </div>
      <p className="mt-1 text-sm text-bark-600">{copy.adminIntro}</p>

      <form
        onSubmit={handleSubmit}
        method="post"
        className="mt-5 rounded-3xl border border-bark-200 bg-paper p-6 shadow-soft"
      >
        <Field
          label={copy.adminPassphrase}
          name="passphrase"
          type="password"
          required
          maxLength={200}
          autoComplete="current-password"
        />

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={busy} className="mt-5 w-full">
          {busy ? copy.adminChecking : copy.adminSubmit}
        </Button>
      </form>
    </div>
  );
}
