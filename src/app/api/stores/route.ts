import { randomBytes } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { regionIdForName } from "@/lib/regions";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/same-origin";
import { storeApplicationSchema } from "@/lib/store-application-schema";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_192;

function slugify(storeName: string): string {
  const base = storeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "store"}-${randomBytes(3).toString("hex")}`;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { code: "forbidden_origin", error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  }

  const limit = rateLimit(`store-apply:${clientKeyFromHeaders(request.headers)}`, 3, 3_600_000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        code: "rate_limited",
        error: "Too many applications from this address. Please try again later.",
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

  const parsed = storeApplicationSchema.safeParse(body);
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
  const existing = await prisma.organicStore.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  // Never update an existing record here. An upsert would let anyone overwrite a
  // verified shop's phone number and intercept its callers. The response is
  // identical either way so this endpoint cannot be used to test which emails
  // are already registered.
  if (!existing) {
    await prisma.organicStore.create({
      data: {
        slug: slugify(input.storeName),
        storeName: input.storeName,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone,
        regionId: await regionIdForName(input.region),
        addressLine: input.addressLine,
        about: input.about,
        govtIdLast4: input.govtIdLast4,
        fssaiNumber: input.fssaiNumber,
        certifier: input.certifier || null,
        certificateNo: input.certificateNo || null,
        certificateUrl: input.certificateUrl || null,
        // Status is never taken from the request; an admin promotes to VERIFIED.
        status: "PENDING",
      },
    });
  }

  return NextResponse.json({ received: true }, { status: 201 });
}
