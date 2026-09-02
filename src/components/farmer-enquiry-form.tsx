"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/client";
import { format } from "@/lib/i18n/config";

const ERROR_KEYS = {
  invalid_fields: "invalid",
  rate_limited: "rateLimited",
  not_found: "unavailable",
  not_signed_in: "unavailable",
  access_expired: "unavailable",
  duplicate_enquiry: "duplicate",
} as const;

export function FarmerEnquiryForm({
  recipientType,
  recipientId,
  recipientName,
  canShareEmail,
}: {
  recipientType: "FARMER" | "STORE";
  recipientId: string;
  recipientName: string;
  canShareEmail: boolean;
}) {
  const { t } = useI18n();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<"sent" | "stored" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [badFields, setBadFields] = useState<string[]>([]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    setBadFields([]);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType,
          recipientId,
          subject: form.get("subject"),
          message: form.get("message"),
          shareEmail: canShareEmail && form.get("shareEmail") === "on",
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        const key = ERROR_KEYS[body.code as keyof typeof ERROR_KEYS] ?? "invalid";
        setError(t.enquiry[key]);
        setBadFields(body.fields ?? []);
        return;
      }
      setResult(body.delivery === "sent" ? "sent" : "stored");
    } catch {
      setError(t.enquiry.network);
    } finally {
      setSending(false);
    }
  }

  if (result) {
    return (
      <div role="status" className="glass mt-8 rounded-3xl p-6 sm:p-8">
        <p className="font-display text-xl text-leaf-800">
          {result === "sent" ? t.enquiry.sent : t.enquiry.stored}
        </p>
      </div>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl sm:text-3xl">
        {format(t.enquiry.heading, { seller: recipientName })}
      </h2>
      <p className="mt-2 max-w-2xl leading-relaxed text-bark-600">{t.enquiry.intro}</p>
      <form
        onSubmit={submit}
        method="post"
        className="glass mt-5 grid gap-4 rounded-3xl p-6 sm:p-8"
      >
        <Field
          label={t.enquiry.subject}
          name="subject"
          required
          minLength={3}
          maxLength={120}
          invalid={badFields.includes("subject")}
          placeholder={t.enquiry.subjectPlaceholder}
        />
        <TextareaField
          label={t.enquiry.message}
          name="message"
          required
          minLength={20}
          maxLength={1500}
          rows={6}
          placeholder={t.enquiry.messagePlaceholder}
          className={badFields.includes("message") ? "text-red-700" : ""}
        />
        <label className={`field-choice flex items-start gap-3 rounded-2xl border p-4 ${canShareEmail ? "border-bark-200 bg-paper/70" : "border-bark-200 bg-canvas-2/70"}`}>
          <input
            type="checkbox"
            name="shareEmail"
            disabled={!canShareEmail}
            className="mt-1 h-5 w-5 shrink-0 accent-leaf-700"
          />
          <span>
            <span className="block font-medium text-bark-900">{t.enquiry.shareEmail}</span>
            <span className="mt-1 block text-sm leading-relaxed text-bark-600">
              {canShareEmail ? t.enquiry.shareEmailHint : t.enquiry.shareEmailUnverified}
            </span>
          </span>
        </label>
        {error ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={sending} className="justify-self-start">
          {sending ? t.enquiry.sending : t.enquiry.submit}
        </Button>
      </form>
    </section>
  );
}
