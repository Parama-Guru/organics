"use client";

import Link from "next/link";

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
      <div className="mt-8 rounded-2xl border border-dashed border-bark-200 bg-white p-10 text-center">
        <p className="text-bark-600">Your basket is empty.</p>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-full bg-marigold-500 px-5 py-2 text-sm font-medium text-bark-900 hover:bg-marigold-600"
        >
          Browse produce
        </Link>
      </div>
    );
  }

  const delivery = subtotalCents >= freeDeliveryThresholdCents ? 0 : deliveryFeeCents;
  const remainingForFree = freeDeliveryThresholdCents - subtotalCents;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
      <ul className="divide-y divide-bark-200/70 rounded-2xl border border-bark-200/70 bg-white">
        {lines.map((line) => (
          <li key={line.productId} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
            <span aria-hidden className="text-3xl">
              {line.emoji ?? "\u{1F331}"}
            </span>

            <div className="min-w-0 flex-1 basis-40 break-words">
              <Link href={`/products/${line.slug}`} className="font-medium hover:underline">
                {line.name}
              </Link>
              <p className="text-sm text-bark-600">
                {formatMoney(line.priceCents)} per {line.unit}
              </p>
            </div>

            {/* Full width so the controls wrap onto their own row on phones. */}
            <div className="flex w-full items-center gap-4 sm:w-auto">
              <label className="flex items-center gap-2 text-sm">
                <span className="sr-only">Quantity for {line.name}</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={line.quantity}
                  onChange={(event) => setQuantity(line.productId, Number(event.target.value))}
                  className="h-10 w-16 rounded-md border border-bark-200 px-2 text-center"
                />
              </label>

              <p className="ml-auto w-20 text-right font-medium tabular-nums sm:ml-0">
                {formatMoney(line.priceCents * line.quantity)}
              </p>

              <button
                type="button"
                onClick={() => removeItem(line.productId)}
                className="shrink-0 py-2 text-sm text-bark-600 underline hover:text-bark-900"
              >
                Remove
                <span className="sr-only"> {line.name}</span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-2xl border border-bark-200/70 bg-white p-5">
        <h2 className="font-semibold">Order summary</h2>

        <dl className="mt-4 space-y-2 text-sm">
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

        {delivery > 0 ? (
          <p className="mt-3 text-xs text-bark-600">
            Add {formatMoney(remainingForFree)} more for free delivery.
          </p>
        ) : null}

        <Link
          href="/checkout"
          className="mt-5 block rounded-full bg-marigold-500 px-5 py-3 text-center text-sm font-medium text-bark-900 hover:bg-marigold-600"
        >
          Checkout
        </Link>
      </aside>
    </div>
  );
}
