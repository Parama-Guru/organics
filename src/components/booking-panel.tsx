"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, TextareaField } from "@/components/ui/field";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useI18n } from "@/lib/i18n/client";
import { apiErrorMessage } from "@/lib/i18n/api-error";
import { format } from "@/lib/i18n/config";

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
  const { t } = useI18n();
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
        setError(apiErrorMessage(t, result));
        return;
      }
      setReference(result.reference);
    } catch {
      setError(t.errors.network);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="contact" className="glass mt-10 scroll-mt-24 rounded-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl break-words">
            {format(t.booking.heading, { seller: sellerName })}
          </h2>
          <p className="mt-1 text-sm text-bark-600">
            {farmer ? `${farmer.contactName} · ${farmer.region}` : t.booking.stockedBy}
          </p>
        </div>
        {farmer?.verifiedAt ? (
          <Badge tone="leaf" className="shrink-0">
            <span aria-hidden>&#10003;</span> {t.farmers.verified}
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
          {open ? t.booking.close : t.booking.open}
        </Button>
      </div>

      {reference ? (
        <div
          role="status"
          className="mt-5 animate-pop rounded-2xl border border-leaf-300 bg-leaf-50 p-4 text-sm"
        >
          <p className="font-semibold text-leaf-800">{t.booking.received}</p>
          <p className="mt-1 text-bark-600">
            {t.booking.referenceBefore}
            <span className="font-mono font-semibold">{reference}</span>
            {format(t.booking.referenceAfter, { seller: sellerName })}
          </p>
        </div>
      ) : open ? (
        <form onSubmit={handleSubmit} className="mt-5 grid animate-rise gap-4 sm:grid-cols-2">
          <Field
            label={t.booking.yourName}
            name="customerName"
            required
            maxLength={120}
            autoComplete="name"
          />

          <Field
            label={t.booking.phone}
            name="phone"
            type="tel"
            required
            maxLength={20}
            autoComplete="tel"
            placeholder={t.booking.phonePlaceholder}
          />

          <div>
            <span className="text-sm font-semibold text-bark-900">
              {format(t.booking.quantity, { unit })}
            </span>
            <div className="mt-1.5">
              <QuantityStepper
                value={quantity}
                max={500}
                label={format(t.booking.quantityLabel, { unit })}
                onChange={setQuantity}
              />
            </div>
            <input type="hidden" name="quantity" value={quantity} />
          </div>

          <Field
            label={t.booking.preferredDate}
            hint={t.booking.optional}
            name="preferredDate"
            type="date"
          />

          <TextareaField
            label={t.booking.note}
            hint={t.booking.optional}
            name="note"
            rows={2}
            maxLength={600}
            placeholder={format(t.booking.notePlaceholder, { seller: sellerName })}
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
            {submitting ? t.booking.submitting : format(t.booking.submit, { product: productName })}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
