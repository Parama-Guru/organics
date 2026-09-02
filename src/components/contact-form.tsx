"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/field";
import { CONTACT_ROLES } from "@/lib/contact-schema";
import { useI18n } from "@/lib/i18n/client";
import { apiErrorMessage } from "@/lib/i18n/api-error";
import { format } from "@/lib/i18n/config";

export function ContactForm({ initialRole }: { initialRole?: string }) {
  const { t } = useI18n();
  const [role, setRole] = useState<string>(
    (CONTACT_ROLES as readonly string[]).includes(initialRole ?? "")
      ? (initialRole as string)
      : "CUSTOMER",
  );
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badFields, setBadFields] = useState<string[]>([]);

  const roles = [
    { value: "CUSTOMER", label: t.contactPage.roleCustomer, hint: t.contactPage.roleCustomerHint },
    { value: "FARMER", label: t.contactPage.roleFarmer, hint: t.contactPage.roleFarmerHint },
    { value: "STORE", label: t.contactPage.roleStore, hint: t.contactPage.roleStoreHint },
    { value: "OTHER", label: t.contactPage.roleOther, hint: t.contactPage.roleOtherHint },
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setBadFields([]);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contact", {
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
      <div role="status" className="editorial-panel animate-pop rounded-[2rem] p-10 text-center">
        <span aria-hidden className="text-5xl">
          {"\u{2709}\u{FE0F}"}
        </span>
        <h2 className="mt-4 font-display text-2xl">{t.contactPage.doneTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-bark-600">{t.contactPage.doneBody}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      method="post"
      className="editorial-panel grid grid-cols-[minmax(0,1fr)] gap-5 rounded-[2rem] p-6 sm:grid-cols-2 sm:p-8"
    >
      {/* A real radio group, not a select: the four answers are the first thing
          the page asks and they each need a line of explanation, which an
          option element cannot carry. */}
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-semibold text-bark-900">
          {t.contactPage.roleHeading}
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {roles.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-bark-200 bg-bark-50 p-4 transition-colors has-[:checked]:border-leaf-500 has-[:checked]:bg-leaf-50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-leaf-400/20"
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="mt-1 h-4 w-4 shrink-0 accent-marigold-500"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-bark-900">{option.label}</span>
                <span className="mt-0.5 block text-sm text-ink">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        label={t.contactPage.name}
        name="name"
        required
        maxLength={120}
        autoComplete="name"
      />
      <Field
        label={t.contactPage.email}
        name="email"
        type="email"
        required
        maxLength={200}
        autoComplete="email"
      />
      <Field
        label={t.contactPage.phone}
        hint={t.contactPage.optional}
        name="phone"
        type="tel"
        maxLength={20}
        autoComplete="tel"
        placeholder={t.contactPage.phonePlaceholder}
        className="sm:col-span-2"
      />
      <TextareaField
        label={t.contactPage.message}
        hint={t.contactPage.messageHint}
        name="message"
        rows={5}
        required
        minLength={10}
        maxLength={2000}
        placeholder={t.contactPage.messagePlaceholder}
        className="sm:col-span-2"
      />

      {error ? (
        <p
          role="alert"
          className="animate-pop rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
        >
          {error}
          {badFields.length > 0 ? (
            <> {format(t.contactPage.checkFields, { fields: badFields.join(", ") })}</>
          ) : null}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting} className="sm:col-span-2">
        {submitting ? t.contactPage.submitting : t.contactPage.submit}
      </Button>
    </form>
  );
}
