"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/client";
import { apiErrorMessage } from "@/lib/i18n/api-error";
import { format, localePath } from "@/lib/i18n/config";

export function FarmerApplicationForm() {
  const { t, locale } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badFields, setBadFields] = useState<string[]>([]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setBadFields([]);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/farmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(apiErrorMessage(t, result));
        setBadFields(result.fields ?? []);
        return;
      }
      setDone(true);
    } catch {
      setError(t.errors.network);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="editorial-panel mt-8 animate-pop rounded-[2rem] p-10 text-center">
        <span aria-hidden className="text-5xl">
          {"\u{1F33E}"}
        </span>
        <h2 className="mt-4 font-display text-2xl">{t.application.doneTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-bark-600">{t.application.doneBody}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      method="post"
      className="editorial-panel mt-8 grid grid-cols-[minmax(0,1fr)] gap-5 rounded-[2rem] p-6 sm:grid-cols-2 sm:p-8"
    >
      <Field
        label={t.application.farmName}
        name="farmName"
        required
        maxLength={120}
        autoComplete="organization"
      />
      <Field
        label={t.application.contactName}
        name="contactName"
        required
        maxLength={120}
        autoComplete="name"
      />
      <Field
        label={t.application.email}
        name="email"
        type="email"
        required
        maxLength={200}
        autoComplete="email"
      />
      <Field
        label={t.application.phone}
        name="phone"
        type="tel"
        required
        maxLength={20}
        autoComplete="tel"
        placeholder={t.application.phonePlaceholder}
      />
      <Field
        label={t.application.region}
        hint={t.application.regionHint}
        name="region"
        required
        maxLength={80}
        placeholder={t.application.regionPlaceholder}
      />
      <Field
        label={t.application.govtId}
        hint={t.application.govtIdHint}
        name="govtIdLast4"
        required
        inputMode="numeric"
        maxLength={4}
        placeholder="1234"
      />
      <Field
        label={t.application.certifier}
        hint={t.application.certifierHint}
        name="certifier"
        required
        minLength={3}
        maxLength={160}
        placeholder={t.application.certifierPlaceholder}
        className="sm:col-span-2"
      />
      <Field
        label={t.application.certificateNo}
        name="certificateNo"
        required
        minLength={3}
        maxLength={80}
      />
      <Field
        label={t.application.certifiedUntil}
        name="certifiedUntil"
        type="date"
        required
      />
      <Field
        label={t.application.certificate}
        hint={t.application.optional}
        name="certificateUrl"
        type="url"
        maxLength={500}
        placeholder="https://…"
      />
      <TextareaField
        label={t.application.about}
        hint={t.application.aboutHint}
        name="about"
        rows={4}
        required
        minLength={20}
        maxLength={1000}
        placeholder={t.application.aboutPlaceholder}
        className="sm:col-span-2"
      />

      {error ? (
        <p
          role="alert"
          className="animate-pop rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
        >
          {error}
          {badFields.length > 0 ? (
            <> {format(t.application.checkFields, { fields: badFields.join(", ") })}</>
          ) : null}
        </p>
      ) : null}

      <p className="text-sm text-bark-600 sm:col-span-2">{t.application.aadhaarNote}</p>

      {/* This form asks a farmer for a phone number and four Aadhaar digits. The
          page that says what we do with them should be one tap away from the
          submit button, not buried in the footer. */}
      <p className="text-sm text-bark-600 sm:col-span-2">
        <Link
          href={localePath(locale, "/privacy")}
          className="rounded underline decoration-bark-300 underline-offset-4 hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-400"
        >
          {t.application.privacyLink}
        </Link>
      </p>

      <Button type="submit" size="lg" disabled={submitting} className="sm:col-span-2">
        {submitting ? t.application.submitting : t.application.submit}
      </Button>
    </form>
  );
}
