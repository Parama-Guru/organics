"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/money";

type Props = {
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
};

const fields = [
  { name: "customerName", label: "Full name", autoComplete: "name", required: true },
  { name: "email", label: "Email", type: "email", autoComplete: "email", required: true },
  {
    name: "addressLine1",
    label: "Address line 1",
    autoComplete: "address-line1",
    required: true,
  },
  {
    name: "addressLine2",
    label: "Address line 2 (optional)",
    autoComplete: "address-line2",
    required: false,
  },
  { name: "city", label: "City", autoComplete: "address-level2", required: true },
  { name: "postalCode", label: "Postal code", autoComplete: "postal-code", required: true },
  { name: "country", label: "Country", autoComplete: "country-name", required: true },
] as const;

export function CheckoutForm({ deliveryFeeCents, freeDeliveryThresholdCents }: Props) {
  const router = useRouter();
  const { lines, subtotalCents, clear, hydrated } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hydrated) return <p className="mt-8 text-bark-600">Loading…</p>;

  if (lines.length === 0) {
    return <p className="mt-8 text-bark-600">Your basket is empty, so there is nothing to check out.</p>;
  }

  const delivery = subtotalCents >= freeDeliveryThresholdCents ? 0 : deliveryFeeCents;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      ...Object.fromEntries(formData.entries()),
      items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "We could not place that order.");
        return;
      }

      clear();
      router.push(`/orders/${result.orderNumber}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="glass grid min-w-0 animate-rise gap-4 rounded-3xl p-6 sm:grid-cols-2">
        {fields.map((field) => (
          <Field
            key={field.name}
            label={field.label}
            name={field.name}
            type={"type" in field ? field.type : "text"}
            autoComplete={field.autoComplete}
            required={field.required}
            maxLength={200}
            className={field.name.startsWith("address") ? "sm:col-span-2" : ""}
          />
        ))}

        {error ? (
          <p
            role="alert"
            className="animate-pop rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
          >
            {error}
          </p>
        ) : null}
      </div>

      {/* min-w-0: grid items default to min-width:auto, so a long product name in
          the summary below would otherwise widen the whole column past the viewport. */}
      <aside className="glass h-fit min-w-0 animate-rise rounded-3xl p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-lg">Summary</h2>

        <ul className="mt-3 space-y-1 text-sm text-bark-600">
          {lines.map((line) => (
            <li key={line.productId} className="flex justify-between gap-3">
              <span className="min-w-0 truncate">
                {line.name} &times; {line.quantity}
              </span>
              <span className="shrink-0 tabular-nums">
                {formatMoney(line.priceCents * line.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-bark-200/70 pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-bark-600">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bark-600">Delivery</dt>
            <dd className="tabular-nums">{delivery === 0 ? "Free" : formatMoney(delivery)}</dd>
          </div>
          <div className="flex justify-between border-t border-bark-200/70 pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(subtotalCents + delivery)}</dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-bark-600">
          Totals are recalculated on the server from live catalog prices before the order is saved.
        </p>

        <Button type="submit" size="lg" disabled={submitting} className="mt-5 w-full">
          {submitting ? "Placing order…" : "Place order"}
        </Button>
      </aside>
    </form>
  );
}
