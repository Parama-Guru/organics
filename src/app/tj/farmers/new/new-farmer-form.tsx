"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createFarmer } from "@/app/tj/actions";
import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/field";

export function NewFarmerForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      setError(null);
      const result = await createFarmer(form);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/tj");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 grid gap-4 rounded-3xl border border-bark-200 bg-white p-6 sm:grid-cols-2"
    >
      <Field label="Farm name" name="farmName" required maxLength={120} />
      <Field label="Contact name" name="contactName" required maxLength={120} />
      <Field label="Email" name="email" type="email" required maxLength={200} />
      <Field
        label="Phone"
        name="phone"
        type="tel"
        required
        maxLength={20}
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
        hint="for your records"
        name="govtIdLast4"
        required
        inputMode="numeric"
        maxLength={4}
        placeholder="1234"
      />
      {/* Both are required by farmerApplicationSchema and both are published on
          the farm's public page. Leaving them off the form made this page
          impossible to submit: it failed with "check these fields: certifier,
          certificateNo" against fields that were not on screen. */}
      <Field
        label="Certified by"
        hint="the certifying body"
        name="certifier"
        required
        maxLength={160}
        placeholder="Indian Organic Certification Agency"
      />
      <Field
        label="Certificate number"
        name="certificateNo"
        required
        maxLength={80}
        placeholder="IOCA/2026/00123"
      />
      <Field
        label="Certificate valid until"
        hint="optional"
        name="certifiedUntil"
        type="date"
      />
      <Field
        label="Organic certificate link"
        hint="optional"
        name="certificateUrl"
        type="url"
        maxLength={500}
        placeholder="https://…"
      />
      <TextareaField
        label="About the farm"
        hint="at least 20 characters, shown publicly"
        name="about"
        rows={4}
        required
        minLength={20}
        maxLength={1000}
        className="sm:col-span-2"
      />

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} className="sm:col-span-2">
        {pending ? "Saving…" : "Add farm and publish"}
      </Button>
    </form>
  );
}
