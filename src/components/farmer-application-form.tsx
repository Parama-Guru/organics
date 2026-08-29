"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/field";

export function FarmerApplicationForm() {
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
        setError(result.error ?? "We could not send that application.");
        setBadFields(result.fields ?? []);
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="glass mt-8 animate-pop rounded-3xl p-10 text-center">
        <span aria-hidden className="text-5xl">
          {"\u{1F33E}"}
        </span>
        <h2 className="mt-4 font-display text-2xl">Application received</h2>
        <p className="mx-auto mt-2 max-w-md text-bark-600">
          We check every farm before its listings go live, so nothing appears in the shop yet.
          Expect a call on the number you gave us within a few working days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass mt-8 grid animate-rise gap-4 rounded-3xl p-6 sm:grid-cols-2">
      <Field label="Farm name" name="farmName" required maxLength={120} autoComplete="organization" />
      <Field label="Your name" name="contactName" required maxLength={120} autoComplete="name" />
      <Field label="Email" name="email" type="email" required maxLength={200} autoComplete="email" />
      <Field
        label="Phone"
        name="phone"
        type="tel"
        required
        maxLength={20}
        autoComplete="tel"
        placeholder="+91 98765 43210"
      />
      <Field
        label="Region"
        hint="district or hills"
        name="region"
        required
        maxLength={80}
        placeholder="Nilgiris"
      />
      <Field
        label="Aadhaar last 4 digits"
        hint="for verification"
        name="govtIdLast4"
        required
        inputMode="numeric"
        maxLength={4}
        placeholder="1234"
      />
      <Field
        label="Organic certificate link"
        hint="optional"
        name="certificateUrl"
        type="url"
        maxLength={500}
        placeholder="https://…"
        className="sm:col-span-2"
      />
      <TextareaField
        label="About the farm"
        hint="at least 20 characters"
        name="about"
        rows={4}
        required
        minLength={20}
        maxLength={1000}
        placeholder="What you grow, how long you have farmed it, and how it is certified."
        className="sm:col-span-2"
      />

      {error ? (
        <p
          role="alert"
          className="animate-pop rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
        >
          {error}
          {badFields.length > 0 ? <> Check: {badFields.join(", ")}.</> : null}
        </p>
      ) : null}

      <p className="text-xs text-bark-600 sm:col-span-2">
        We only ask for the last four digits of your Aadhaar. Never share the full number.
      </p>

      <Button type="submit" size="lg" disabled={submitting} className="sm:col-span-2">
        {submitting ? "Sending…" : "Send application"}
      </Button>
    </form>
  );
}
