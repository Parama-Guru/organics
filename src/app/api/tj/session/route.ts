import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { loadConfig } from "@conf/config";
import { ADMIN_COOKIE, isAdminEnabled, issueSession } from "@/lib/admin-auth";
import { verifyPassphrase } from "@/lib/admin-hash";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";
import { readBoundedJson } from "@/lib/request-body";
import { isSameOrigin } from "@/lib/same-origin";
import { consumeRateLimit } from "@/lib/session-store";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ passphrase: z.string().min(1).max(200) });

export async function POST(request: NextRequest) {
  // With no passphrase configured the admin area does not exist at all.
  if (!isAdminEnabled()) {
    return NextResponse.json({ code: "not_found" }, { status: 404 });
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ code: "forbidden_origin" }, { status: 403 });
  }

  // Slow down guessing. Deliberately tighter than the public endpoints.
  //
  // Two limiters on purpose: the Redis one is shared across replicas, which is
  // what actually caps an attacker; the in-process one still applies if Redis
  // is unreachable, so a Redis outage cannot open the door. The admin area has
  // one shared credential, so this is the most valuable door on the site and
  // was previously the only one still on the weaker per-process limiter.
  const clientKey = clientKeyFromHeaders(request.headers);
  const shared = await consumeRateLimit(`admin-login:${clientKey}`, 5, 900);
  const local = rateLimit(`admin-login:${clientKey}`, 5, 900_000);
  if (!shared.allowed || !local.allowed) {
    const retryAfter = Math.max(shared.retryAfterSeconds, local.retryAfterSeconds, 60);
    return NextResponse.json(
      { code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const body = await readBoundedJson(request, 1_024);
  const parsed = body.ok ? bodySchema.safeParse(body.value) : null;
  if (!parsed?.success) {
    return NextResponse.json({ code: "invalid_fields" }, { status: 400 });
  }

  const { admin } = loadConfig();
  if (!verifyPassphrase(parsed.data.passphrase, admin.password_hash)) {
    // No hint about whether the passphrase was close, and no timing signal:
    // scrypt runs either way.
    return NextResponse.json({ code: "bad_passphrase" }, { status: 401 });
  }

  const { token, maxAge } = issueSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: new URL(loadConfig().app.site_url).protocol === "https:",
    path: "/tj",
    maxAge,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { path: "/tj", maxAge: 0 });
  return response;
}
