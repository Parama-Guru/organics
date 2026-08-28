"use client";

import { useState } from "react";

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
    <section className="mt-8 rounded-2xl border border-bark-200 bg-bark-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">Buy direct from {sellerName}</h2>
          <p className="mt-1 text-sm text-bark-600">
            {farmer
              ? `${farmer.contactName} · ${farmer.region}`
              : "Stocked and dispatched by Organics."}
          </p>
        </div>
        {farmer?.verifiedAt ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-leaf-100 px-3 py-1 text-xs font-medium text-leaf-800">
            <span aria-hidden>&#10003;</span> Verified farmer
          </span>
        ) : null}
      </div>

      {farmer?.about ? <p className="mt-3 text-sm text-bark-600">{farmer.about}</p> : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {phone ? (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-2 rounded-full border-2 border-bark-900 px-5 py-2.5 text-sm font-medium text-bark-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-bark-900 hover:text-bark-50"
          >
            <span aria-hidden>&#9742;</span> {phone}
          </a>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="rounded-full bg-marigold-500 px-5 py-2.5 text-sm font-medium text-bark-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-marigold-400"
        >
          {open ? "Close booking form" : "Book without paying now"}
        </button>
      </div>

      {reference ? (
        <div
          role="status"
          className="mt-4 animate-rise rounded-xl border border-leaf-300 bg-leaf-50 p-4 text-sm"
        >
          <p className="font-medium text-leaf-800">Booking received.</p>
          <p className="mt-1 text-bark-600">
            Your reference is <span className="font-mono font-medium">{reference}</span>.{" "}
            {sellerName} will call you to confirm quantity and delivery.
          </p>
        </div>
      ) : open ? (
        <form onSubmit={handleSubmit} className="mt-4 grid animate-rise gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="font-medium">Your name</span>
            <input
              name="customerName"
              required
              maxLength={120}
              autoComplete="name"
              className="mt-1 w-full rounded-md border border-bark-200 bg-white px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="font-medium">Phone</span>
            <input
              name="phone"
              type="tel"
              required
              maxLength={20}
              autoComplete="tel"
              placeholder="+91 98765 43210"
              className="mt-1 w-full rounded-md border border-bark-200 bg-white px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="font-medium">Quantity ({unit})</span>
            <input
              name="quantity"
              type="number"
              min={1}
              max={500}
              defaultValue={1}
              required
              className="mt-1 w-full rounded-md border border-bark-200 bg-white px-3 py-2"
            />
          </label>

          <label className="text-sm">
            <span className="font-medium">Preferred date (optional)</span>
            <input
              name="preferredDate"
              type="date"
              className="mt-1 w-full rounded-md border border-bark-200 bg-white px-3 py-2"
            />
          </label>

          <label className="text-sm sm:col-span-2">
            <span className="font-medium">Note (optional)</span>
            <textarea
              name="note"
              rows={2}
              maxLength={600}
              placeholder={`Anything ${sellerName} should know about this order`}
              className="mt-1 w-full rounded-md border border-bark-200 bg-white px-3 py-2"
            />
          </label>

          {error ? (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-bark-900 px-5 py-2.5 text-sm font-medium text-bark-50 transition-colors hover:bg-bark-800 disabled:opacity-60 sm:col-span-2"
          >
            {submitting ? "Sending…" : `Request ${productName}`}
          </button>
        </form>
      ) : null}
    </section>
  );
}
