"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/money";

type Props = {
  deliveryFeeCents: number;
  freeDeliveryThresholdCents: number;
};

export function CartView({ deliveryFeeCents, freeDeliveryThresholdCents }: Props) {
  const { lines, subtotalCents, setQuantity, removeItem, hydrated } = useCart();

  if (!hydrated) {
    return <p className="mt-8 text-bark-600">Loading your basket…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="glass mt-8 animate-rise rounded-3xl p-12 text-center">
        <span aria-hidden className="text-5xl">
          {"\u{1F9FA}"}
        </span>
        <p className="mt-4 font-display text-xl">Your basket is empty</p>
        <p className="mt-1 text-sm text-bark-600">
          Pick something fresh and it will show up here.
        </p>
        <Button as={Link} href="/products" className="mt-6">
          Browse produce
        </Button>
      </div>
    );
  }

  const delivery = subtotalCents >= freeDeliveryThresholdCents ? 0 : deliveryFeeCents;
  const remainingForFree = freeDeliveryThresholdCents - subtotalCents;
  const freeDeliveryProgress = Math.min(
    100,
    (subtotalCents / freeDeliveryThresholdCents) * 100,
  );

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
      <ul className="glass animate-rise divide-y divide-bark-200/60 overflow-hidden rounded-3xl">
        {lines.map((line) => (
          <li key={line.productId} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-leaf-50 text-3xl shadow-soft"
            >
              {line.emoji ?? "\u{1F331}"}
            </span>

            <div className="min-w-0 flex-1 basis-40 break-words">
              <Link
                href={`/products/${line.slug}`}
                className="font-semibold decoration-marigold-500 decoration-2 underline-offset-4 hover:underline"
              >
                {line.name}
              </Link>
              <p className="text-sm text-bark-600">
                {formatMoney(line.priceCents)} per {line.unit}
              </p>
            </div>

            {/* Full width so the controls wrap onto their own row on phones. */}
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <QuantityStepper
                value={line.quantity}
                label={`Quantity for ${line.name}`}
                onChange={(next) => setQuantity(line.productId, next)}
              />

              <p className="ml-auto w-24 text-right font-semibold tabular-nums sm:ml-0">
                {formatMoney(line.priceCents * line.quantity)}
              </p>

              <button
                type="button"
                onClick={() => removeItem(line.productId)}
                aria-label={`Remove ${line.name}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-bark-600 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <span aria-hidden className="text-lg leading-none">
                  &times;
                </span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <aside className="glass h-fit animate-rise rounded-3xl p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-lg">Order summary</h2>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-bark-600">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bark-600">Delivery</dt>
            <dd className="tabular-nums">{delivery === 0 ? "Free" : formatMoney(delivery)}</dd>
          </div>
          <div className="mt-1 flex justify-between border-t border-bark-200/70 pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(subtotalCents + delivery)}</dd>
          </div>
        </dl>

        {delivery > 0 ? (
          <div className="mt-4">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-bark-200"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(freeDeliveryProgress)}
              aria-label="Progress towards free delivery"
            >
              <div
                className="h-full rounded-full bg-marigold-500 transition-[width] duration-500"
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-bark-600">
              Add {formatMoney(remainingForFree)} more for free delivery.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-xs font-medium text-leaf-700">
            Free delivery unlocked.
          </p>
        )}

        <Button as={Link} href="/checkout" size="lg" className="mt-5 w-full">
          Checkout
        </Button>
      </aside>
    </div>
  );
}
