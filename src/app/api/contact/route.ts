import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { contactMessageSchema } from "@/lib/contact-schema";
import { prisma } from "@/lib/prisma";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/same-origin";

export const dynamic = "force-dynamic";

// Larger than the application routes: this one carries a 2,000 character
// message, and the limit is what stops a body big enough to matter.
const MAX_BODY_BYTES = 16_384;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { code: "forbidden_origin", error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  }

  // Five an hour: enough for someone who sends one, spots a typo and sends it
  // again, and low enough that the table cannot be filled from one address.
  const limit = rateLimit(`contact:${clientKeyFromHeaders(request.headers)}`, 5, 3_600_000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        code: "rate_limited",
        error: "Too many messages from this address. Please try again later.",
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

  const parsed = contactMessageSchema.safeParse(body);
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
  await prisma.contactMessage.create({
    data: {
      role: input.role,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      message: input.message,
    },
  });

  return NextResponse.json({ received: true }, { status: 201 });
}
