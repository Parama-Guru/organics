import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "hidden";
  const visible = user.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(user.length - 2, 1))}@${domain}`;
}

export default async function OrderPage({ params }: PageProps<"/orders/[orderNumber]">) {
  const { orderNumber } = await params;

  // Deliberately narrow: the order number alone grants access, so no full address is returned.
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      status: true,
      email: true,
      city: true,
      country: true,
      subtotalCents: true,
      deliveryCents: true,
      totalCents: true,
      createdAt: true,
      items: {
        select: { id: true, productName: true, quantity: true, unitPriceCents: true },
      },
    },
  });

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="glass animate-rise rounded-3xl p-8 text-center">
        <span aria-hidden className="text-5xl">
          {"\u{1F33F}"}
        </span>
        <h1 className="mt-4 font-display text-2xl text-leaf-800">
          Thank you — your order is in.
        </h1>
        <p className="mt-2 text-sm text-bark-600">
          Confirmation sent to {maskEmail(order.email)}. Keep this reference safe.
        </p>
        <p className="mt-4 inline-block rounded-full bg-bark-900 px-5 py-2 font-mono text-lg text-marigold-50">
          {order.orderNumber}
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 text-sm xs:grid-cols-2 sm:grid-cols-3">
        <div>
          <dt className="text-bark-600">Status</dt>
          <dd className="font-medium">{order.status}</dd>
        </div>
        <div>
          <dt className="text-bark-600">Placed</dt>
          <dd className="font-medium">{order.createdAt.toISOString().slice(0, 10)}</dd>
        </div>
        <div>
          <dt className="text-bark-600">Delivering to</dt>
          <dd className="font-medium">
            {order.city}, {order.country}
          </dd>
        </div>
      </dl>

      <ul className="glass mt-6 divide-y divide-bark-200/60 overflow-hidden rounded-3xl">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 p-4 text-sm">
            <span>
              {item.productName} &times; {item.quantity}
            </span>
            <span className="tabular-nums">
              {formatMoney(item.unitPriceCents * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-bark-600">Subtotal</dt>
          <dd className="tabular-nums">{formatMoney(order.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-bark-600">Delivery</dt>
          <dd className="tabular-nums">
            {order.deliveryCents === 0 ? "Free" : formatMoney(order.deliveryCents)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-bark-200/70 pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatMoney(order.totalCents)}</dd>
        </div>
      </dl>

      <Button as={Link} href="/products" size="lg" className="mt-8">
        Continue shopping
      </Button>
    </div>
  );
}
