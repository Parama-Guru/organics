import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { contactMessageSchema } from "@/lib/contact-schema";
import { notifyContactMessage } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { readBoundedJson } from "@/lib/request-body";
import { clientKeyFromHeaders } from "@/lib/rate-limit";
import { consumeRateLimit } from "@/lib/session-store";
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
  const limit = await consumeRateLimit(
    `contact:${clientKeyFromHeaders(request.headers)}`,
    5,
    3_600,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      {
        code: "rate_limited",
        error: "Too many messages from this address. Please try again later.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const body = await readBoundedJson(request, MAX_BODY_BYTES);
  if (!body.ok) {
    return NextResponse.json(
      {
        code: body.tooLarge ? "body_too_large" : "invalid_json",
        error: body.tooLarge ? "Request body is too large." : "Request body must be valid JSON.",
      },
      { status: body.tooLarge ? 413 : 400 },
    );
  }

  const parsed = contactMessageSchema.safeParse(body.value);
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
  await notifyContactMessage({
    name: input.name,
    email: input.email,
    role: input.role,
    message: input.message,
  });

  return NextResponse.json({ received: true }, { status: 201 });
}
