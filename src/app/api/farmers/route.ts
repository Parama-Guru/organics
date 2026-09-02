import { randomBytes } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { farmerApplicationSchema } from "@/lib/farmer-application-schema";
import { endOfIndiaDate } from "@/lib/india-date";
import { notifyApplication } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { regionIdForName } from "@/lib/regions";
import { readBoundedJson } from "@/lib/request-body";
import { clientKeyFromHeaders } from "@/lib/rate-limit";
import { consumeRateLimit } from "@/lib/session-store";
import { isSameOrigin } from "@/lib/same-origin";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_192;

function slugify(farmName: string): string {
  const base = farmName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "farm"}-${randomBytes(3).toString("hex")}`;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { code: "forbidden_origin", error: "Cross-origin requests are not allowed." },
      { status: 403 },
    );
  }

  const limit = await consumeRateLimit(
    `farmer-apply:${clientKeyFromHeaders(request.headers)}`,
    3,
    3_600,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      {
        code: "rate_limited",
        error: "Too many applications from this address. Please try again later.",
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

  const parsed = farmerApplicationSchema.safeParse(body.value);
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
  const existing = await prisma.farmer.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  // Never update an existing record here. An upsert would let anyone overwrite a
  // verified farmer's phone number and intercept their orders. The response is
  // identical either way so this endpoint cannot be used to test which emails
  // are already registered.
  if (!existing) {
    await prisma.farmer.create({
      data: {
        slug: slugify(input.farmName),
        farmName: input.farmName,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone,
        regionId: await regionIdForName(input.region),
        about: input.about,
        govtIdLast4: input.govtIdLast4,
        certifier: input.certifier,
        certificateNo: input.certificateNo,
        certifiedUntil: endOfIndiaDate(input.certifiedUntil)!,
        certificateUrl: input.certificateUrl || null,
        // Status is never taken from the request; an admin promotes to VERIFIED.
        status: "PENDING",
      },
    });
    await notifyApplication({
      kind: "farmer",
      applicantEmail: input.email,
      applicantName: input.contactName,
      entityName: input.farmName,
    });
  }

  return NextResponse.json({ received: true }, { status: 201 });
}
