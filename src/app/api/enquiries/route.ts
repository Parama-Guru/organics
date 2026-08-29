import { randomBytes } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { enquirySchema } from "@/lib/enquiry-schema";
import { prisma } from "@/lib/prisma";
import { publicProductWhere } from "@/lib/products";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_192;

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { code: "forbidden_origin", error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  }

  const limit = rateLimit(`enquiry:${clientKeyFromHeaders(request.headers)}`, 5, 600_000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        code: "rate_limited",
        error: "Too many booking requests from this address. Please try again shortly.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { code: "body_too_large", error: "Request body is too large." },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "invalid_json", error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        code: "invalid_fields",
        error: "Please check the highlighted details.",
        fields: Object.keys(z.flattenError(parsed.error).fieldErrors),
      },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // Re-read the product through the public filter so a booking can never be
  // created against a hidden listing or an unverified farmer's product.
  const product = await prisma.product.findFirst({
    where: { ...publicProductWhere, id: input.productId },
    select: { id: true, farmerId: true, stock: true },
  });

  if (!product) {
    return NextResponse.json(
      { code: "product_unavailable", error: "That product is no longer available." },
      { status: 404 },
    );
  }

  if (input.quantity > product.stock) {
    return NextResponse.json(
      {
        code: "insufficient_stock",
        available: product.stock,
        error: `Only ${product.stock} left. Please reduce the quantity.`,
      },
      { status: 409 },
    );
  }

  const enquiry = await prisma.enquiry.create({
    data: {
      reference: `BK-${randomBytes(4).toString("hex").toUpperCase()}`,
      productId: product.id,
      farmerId: product.farmerId,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email || null,
      quantity: input.quantity,
      preferredDate: input.preferredDate ? new Date(input.preferredDate) : null,
      note: input.note || null,
    },
    select: { reference: true },
  });

  return NextResponse.json({ reference: enquiry.reference }, { status: 201 });
}
