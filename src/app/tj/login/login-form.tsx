"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

const MESSAGES: Record<string, string> = {
  bad_passphrase: "That passphrase is not right.",
  rate_limited: "Too many attempts. Wait about 15 minutes and try again.",
  forbidden_origin: "That request was blocked. Reload the page and try again.",
  invalid_fields: "Enter the passphrase.",
  not_found: "The admin area is not configured on this deployment.",
};

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        setError(MESSAGES[result.code] ?? "Could not sign in.");
        return;
      }
      router.replace("/tj");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-16 max-w-sm rounded-3xl border border-bark-200 bg-white p-6 shadow-soft"
    >
      <h1 className="font-display text-2xl text-bark-900">Sign in</h1>
      <p className="mt-1 text-sm text-bark-600">
        This area manages farm verification. It is not linked from the public site.
      </p>

      <div className="mt-5">
        <Field
          label="Admin passphrase"
          name="passphrase"
          type="password"
          required
          maxLength={200}
          autoComplete="current-password"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={busy} className="mt-5 w-full">
        {busy ? "Checking…" : "Sign in"}
      </Button>
    </form>
  );
}
