import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { loadConfig } from "@conf/config";
import { ADMIN_COOKIE, isAdminEnabled, issueSession } from "@/lib/admin-auth";
import { verifyPassphrase } from "@/lib/admin-hash";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ passphrase: z.string().min(1).max(200) });

export async function POST(request: NextRequest) {
  // With no passphrase configured the admin area does not exist at all.
  if (!isAdminEnabled()) {
    return NextResponse.json({ code: "not_found" }, { status: 404 });
  }

  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return NextResponse.json({ code: "forbidden_origin" }, { status: 403 });
  }

  // Slow down guessing. Deliberately tighter than the public endpoints.
  const limit = rateLimit(`admin-login:${clientKeyFromHeaders(request.headers)}`, 5, 900_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
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
    path: "/admin",
    maxAge,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { path: "/admin", maxAge: 0 });
  return response;
}
