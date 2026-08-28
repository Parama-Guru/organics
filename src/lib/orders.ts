import { randomBytes } from "node:crypto";

import { loadConfig } from "@conf/config";

import { prisma } from "./prisma";
import type { CreateOrderInput } from "./validation";

export class OrderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "OrderError";
  }
}

// The order number is the only credential needed to view an order, so keep the
// random portion wide enough to make enumeration impractical.
function generateOrderNumber(): string {
  const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `ORG-${stamp}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

/** Collapses duplicate product ids so a repeated line item cannot bypass stock checks. */
function mergeItems(items: CreateOrderInput["items"]): Map<string, number> {
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }
  return merged;
}

export function calculateDelivery(subtotalCents: number): number {
  const { commerce } = loadConfig();
  return subtotalCents >= commerce.free_delivery_threshold_cents
    ? 0
    : commerce.delivery_fee_cents;
}

export async function createOrder(input: CreateOrderInput) {
  const quantities = mergeItems(input.items);
  const productIds = [...quantities.keys()];

  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new OrderError("One or more products are unavailable.", 409);
    }

    // Prices come from the database, never from the request body.
    let subtotalCents = 0;
    for (const product of products) {
      subtotalCents += product.priceCents * quantities.get(product.id)!;
    }

    for (const product of products) {
      const quantity = quantities.get(product.id)!;

      // Conditional update is atomic, so concurrent checkouts cannot oversell.
      const { count } = await tx.product.updateMany({
        where: { id: product.id, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });

      if (count !== 1) {
        throw new OrderError(`"${product.name}" does not have enough stock left.`, 409);
      }
    }

    const deliveryCents = calculateDelivery(subtotalCents);

    return tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerName: input.customerName,
        email: input.email,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || null,
        city: input.city,
        postalCode: input.postalCode,
        country: input.country,
        subtotalCents,
        deliveryCents,
        totalCents: subtotalCents + deliveryCents,
        items: {
          create: products.map((product) => ({
            productId: product.id,
            quantity: quantities.get(product.id)!,
            unitPriceCents: product.priceCents,
            productName: product.name,
          })),
        },
      },
      select: { orderNumber: true, totalCents: true },
    });
  });
}
