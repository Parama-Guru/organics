"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/client";
import { apiErrorMessage } from "@/lib/i18n/api-error";
import { format, localePath } from "@/lib/i18n/config";

export function StoreApplicationForm() {
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
      const response = await fetch("/api/stores", {
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
          {"\u{1F3EA}"}
        </span>
        <h2 className="mt-4 font-display text-2xl">{t.storeApplication.doneTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-bark-600">{t.storeApplication.doneBody}</p>
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
        label={t.storeApplication.storeName}
        name="storeName"
        required
        maxLength={120}
        autoComplete="organization"
      />
      <Field
        label={t.storeApplication.contactName}
        name="contactName"
        required
        maxLength={120}
        autoComplete="name"
      />
      <Field
        label={t.storeApplication.email}
        name="email"
        type="email"
        required
        maxLength={200}
        autoComplete="email"
      />
      <Field
        label={t.storeApplication.phone}
        name="phone"
        type="tel"
        required
        maxLength={20}
        autoComplete="tel"
        placeholder={t.storeApplication.phonePlaceholder}
      />
      <Field
        label={t.storeApplication.region}
        hint={t.storeApplication.regionHint}
        name="region"
        required
        maxLength={80}
        autoComplete="address-level2"
        placeholder={t.storeApplication.regionPlaceholder}
      />
      <Field
        label={t.storeApplication.govtId}
        hint={t.storeApplication.govtIdHint}
        name="govtIdLast4"
        required
        inputMode="numeric"
        maxLength={4}
        placeholder="1234"
      />
      <Field
        label={t.storeApplication.address}
        hint={t.storeApplication.addressHint}
        name="addressLine"
        required
        minLength={6}
        maxLength={240}
        autoComplete="street-address"
        placeholder={t.storeApplication.addressPlaceholder}
        className="sm:col-span-2"
      />
      <Field
        label={t.storeApplication.fssai}
        hint={t.storeApplication.fssaiHint}
        name="fssaiNumber"
        required
        inputMode="numeric"
        maxLength={20}
        placeholder="12345678901234"
        className="sm:col-span-2"
      />
      <Field
        label={t.storeApplication.certifier}
        hint={t.storeApplication.certifierHint}
        name="certifier"
        maxLength={160}
        placeholder={t.storeApplication.certifierPlaceholder}
        className="sm:col-span-2"
      />
      <Field
        label={t.storeApplication.certificateNo}
        hint={t.storeApplication.optional}
        name="certificateNo"
        maxLength={80}
      />
      <Field
        label={t.storeApplication.certifiedUntil}
        hint={t.storeApplication.optional}
        name="certifiedUntil"
        type="date"
      />
      <Field
        label={t.storeApplication.certificate}
        hint={t.storeApplication.optional}
        name="certificateUrl"
        type="url"
        maxLength={500}
        placeholder="https://…"
      />
      <TextareaField
        label={t.storeApplication.about}
        hint={t.storeApplication.aboutHint}
        name="about"
        rows={4}
        required
        minLength={20}
        maxLength={1000}
        placeholder={t.storeApplication.aboutPlaceholder}
      />

      {error ? (
        <p
          role="alert"
          className="animate-pop rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
        >
          {error}
          {badFields.length > 0 ? (
            <> {format(t.storeApplication.checkFields, { fields: badFields.join(", ") })}</>
          ) : null}
        </p>
      ) : null}

      <p className="text-sm text-bark-600 sm:col-span-2">{t.storeApplication.aadhaarNote}</p>

      {/* This form asks for a phone number and four Aadhaar digits. The page
          that says what we do with them should be one tap away from the submit
          button, not buried in the footer. */}
      <p className="text-sm text-bark-600 sm:col-span-2">
        <Link
          href={localePath(locale, "/privacy")}
          className="rounded underline decoration-bark-300 underline-offset-4 hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-400"
        >
          {t.storeApplication.privacyLink}
        </Link>
      </p>

      <Button type="submit" size="lg" disabled={submitting} className="sm:col-span-2">
        {submitting ? t.storeApplication.submitting : t.storeApplication.submit}
      </Button>
    </form>
  );
}
