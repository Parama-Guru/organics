import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { OrderError, createOrder } from "@/lib/orders";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";
import { createOrderSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16_384;

/** Rejects cross-site form posts; the storefront always calls this from its own origin. */
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Non-browser clients (curl, tests) send no Origin.
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  }

  const limit = rateLimit(`orders:${clientKeyFromHeaders(request.headers)}`, 5, 600_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many orders from this address. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the highlighted details.",
        fields: Object.keys(z.flattenError(parsed.error).fieldErrors),
      },
      { status: 400 },
    );
  }

  try {
    const order = await createOrder(parsed.data);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    // Log server-side, return an opaque message so internals are never exposed.
    console.error("Order creation failed:", error);
    return NextResponse.json({ error: "We could not place that order." }, { status: 500 });
  }
}
