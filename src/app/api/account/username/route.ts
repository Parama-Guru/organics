import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { accountsEnabled } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { clientKeyFromHeaders } from "@/lib/rate-limit";
import { readBoundedJson } from "@/lib/request-body";
import { isSameOrigin } from "@/lib/same-origin";
import { consumeRateLimit } from "@/lib/session-store";
import { isReservedUsername, normalizeUsername, USERNAME_PATTERN } from "@/lib/username";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ username: z.string().min(1).max(64) });

/**
 * Live availability for the public handle chosen at sign-up.
 *
 * POST rather than GET on purpose: it keeps the handle out of proxy logs and
 * browser history, makes the same-origin check meaningful, and stops the answer
 * being cached anywhere. A handle is a public identifier by design, so this
 * discloses nothing an existing profile would not — the email address, which is
 * a credential, deliberately has no equivalent endpoint.
 */
export async function POST(request: NextRequest) {
  if (!accountsEnabled()) {
    return NextResponse.json({ code: "not_found" }, { status: 404 });
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ code: "forbidden_origin" }, { status: 403 });
  }

  // Generous enough for one person typing, tight enough that harvesting the
  // whole handle space is not worth attempting.
  const gate = await consumeRateLimit(
    `username-check:${clientKeyFromHeaders(request.headers)}`,
    60,
    300,
  );
  if (!gate.allowed) {
    return NextResponse.json(
      { code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.max(gate.retryAfterSeconds, 30)) } },
    );
  }

  const body = await readBoundedJson(request, 512);
  const parsed = body.ok ? bodySchema.safeParse(body.value) : null;
  if (!parsed?.success) {
    return NextResponse.json({ code: "invalid_fields" }, { status: 400 });
  }

  const candidate = normalizeUsername(parsed.data.username);
  if (!USERNAME_PATTERN.test(candidate)) {
    return NextResponse.json({ available: false, code: "invalid_username" });
  }

  // A reserved handle answers "taken" rather than "malformed": it is unavailable
  // for the same reason as any other handle, and answering without a query keeps
  // the list from being measurable by response time.
  if (isReservedUsername(candidate)) {
    return NextResponse.json({ available: false, code: "taken" });
  }

  const existing = await prisma.customer.findUnique({
    where: { username: candidate },
    select: { id: true },
  });

  return NextResponse.json({ available: existing === null, code: existing ? "taken" : "free" });
}
