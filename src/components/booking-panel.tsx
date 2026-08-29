"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/field";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

type Farmer = {
  farmName: string;
  contactName: string;
  phone: string;
  region: string;
  about: string | null;
  verifiedAt: Date | null;
} | null;

type Props = {
  productId: string;
  productName: string;
  unit: string;
  farmer: Farmer;
};

export function BookingPanel({ productId, productName, unit, farmer }: Props) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sellerName = farmer?.farmName ?? "Organics";
  const phone = farmer?.phone ?? null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, ...Object.fromEntries(form.entries()) }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "We could not record that booking.");
        return;
      }
      setReference(result.reference);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="contact" className="glass mt-10 scroll-mt-24 rounded-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl">Buy direct from {sellerName}</h2>
          <p className="mt-1 text-sm text-bark-600">
            {farmer
              ? `${farmer.contactName} · ${farmer.region}`
              : "Stocked and dispatched by Organics."}
          </p>
        </div>
        {farmer?.verifiedAt ? (
          <Badge tone="leaf" className="shrink-0">
            <span aria-hidden>&#10003;</span> Verified farmer
          </Badge>
        ) : null}
      </div>

      {farmer?.about ? <p className="mt-3 text-sm text-bark-600">{farmer.about}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {phone ? (
          <Button as="a" href={`tel:${phone.replace(/\s/g, "")}`} variant="secondary">
            <span aria-hidden>&#9742;</span> {phone}
          </Button>
        ) : null}

        <Button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          {open ? "Close booking form" : "Book without paying now"}
        </Button>
      </div>

      {reference ? (
        <div
          role="status"
          className="mt-5 animate-pop rounded-2xl border border-leaf-300 bg-leaf-50 p-4 text-sm"
        >
          <p className="font-semibold text-leaf-800">Booking received.</p>
          <p className="mt-1 text-bark-600">
            Your reference is <span className="font-mono font-semibold">{reference}</span>.{" "}
            {sellerName} will call you to confirm quantity and delivery.
          </p>
        </div>
      ) : open ? (
        <form onSubmit={handleSubmit} className="mt-5 grid animate-rise gap-4 sm:grid-cols-2">
          <Field
            label="Your name"
            name="customerName"
            required
            maxLength={120}
            autoComplete="name"
          />

          <Field
            label="Phone"
            name="phone"
            type="tel"
            required
            maxLength={20}
            autoComplete="tel"
            placeholder="+91 98765 43210"
          />

          <div>
            <span className="text-sm font-semibold text-bark-900">Quantity ({unit})</span>
            <div className="mt-1.5">
              <QuantityStepper
                value={quantity}
                max={500}
                label={`Quantity in ${unit}`}
                onChange={setQuantity}
              />
            </div>
            <input type="hidden" name="quantity" value={quantity} />
          </div>

          <Field label="Preferred date" hint="optional" name="preferredDate" type="date" />

          <TextareaField
            label="Note"
            hint="optional"
            name="note"
            rows={2}
            maxLength={600}
            placeholder={`Anything ${sellerName} should know about this order`}
            className="sm:col-span-2"
          />

          {error ? (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="dark"
            size="lg"
            disabled={submitting}
            className="sm:col-span-2"
          >
            {submitting ? "Sending\u2026" : `Request ${productName}`}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
