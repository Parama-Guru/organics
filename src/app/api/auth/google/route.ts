import { NextResponse, type NextRequest } from "next/server";
import * as oauth from "oauth4webapi";

import { loadConfig } from "@conf/config";
import { accountsEnabled, getCustomer, type SignedInCustomer } from "@/lib/customer-auth";
import {
  GOOGLE_AS,
  getGoogleCredentials,
  googleClient,
  googleRedirectUri,
} from "@/lib/google-auth";
import {
  DEFAULT_LOCALE,
  isEnabledLocale,
  localePath,
  safeNext,
  type Locale,
} from "@/lib/i18n/config";
import {
  GOOGLE_OAUTH_COOKIE,
  googleOAuthBrowserBinding,
  putGoogleOAuthState,
  type GoogleOAuthIntent,
} from "@/lib/oauth-state";
import { passwordSetSchema } from "@/lib/account-schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/same-origin";
import { consumeRateLimit } from "@/lib/session-store";

export const dynamic = "force-dynamic";

type StartInput = {
  intent: GoogleOAuthIntent;
  customer: SignedInCustomer | null;
  pendingPasswordHash: string | null;
};

function requestDestination(request: NextRequest): { locale: Locale; next: string } {
  const rawLocale = request.nextUrl.searchParams.get("locale");
  const locale = isEnabledLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const rawNext = request.nextUrl.searchParams.get("next") ?? undefined;
  const next = safeNext(rawNext, locale) ?? localePath(locale, "/account");
  return { locale, next };
}

function accountRedirect(request: NextRequest, locale: Locale, query: string) {
  return NextResponse.redirect(
    new URL(`${localePath(locale, "/account")}?${query}`, request.url),
    303,
  );
}

function canonicalRequest(request: NextRequest): NextResponse | null {
  const canonical = new URL(loadConfig().app.site_url);
  if (request.nextUrl.origin === canonical.origin) return null;
  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, canonical);
  return NextResponse.redirect(target, 307);
}

async function beginGoogleAuthorization(request: NextRequest, input: StartInput) {
  if (!accountsEnabled()) return new NextResponse(null, { status: 404 });

  const credentials = getGoogleCredentials();
  if (!credentials) return new NextResponse(null, { status: 404 });

  const clientKey = clientKeyFromHeaders(request.headers);
  const [shared, local] = await Promise.all([
    consumeRateLimit(`google-start:${clientKey}`, 20, 900),
    Promise.resolve(rateLimit(`google-start:${clientKey}`, 20, 900_000)),
  ]);
  if (!shared.allowed || !local.allowed) {
    return new NextResponse(null, {
      status: 429,
      headers: {
        "Retry-After": String(
          Math.max(shared.retryAfterSeconds, local.retryAfterSeconds, 60),
        ),
      },
    });
  }

  const { locale, next } = requestDestination(request);
  const state = oauth.generateRandomState();
  const nonce = oauth.generateRandomNonce();
  const codeVerifier = oauth.generateRandomCodeVerifier();
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);

  await putGoogleOAuthState(state, {
    codeVerifier,
    nonce,
    locale,
    next,
    intent: input.intent,
    customerId: input.customer?.id ?? null,
    sessionVersion: input.customer?.sessionVersion ?? null,
    pendingPasswordHash: input.pendingPasswordHash,
  });

  const authorization = new URL(GOOGLE_AS.authorization_endpoint!);
  authorization.searchParams.set("client_id", googleClient(credentials).client_id);
  authorization.searchParams.set("redirect_uri", googleRedirectUri());
  authorization.searchParams.set("response_type", "code");
  authorization.searchParams.set("scope", "openid email");
  authorization.searchParams.set("state", state);
  authorization.searchParams.set("nonce", nonce);
  authorization.searchParams.set("code_challenge", codeChallenge);
  authorization.searchParams.set("code_challenge_method", "S256");
  authorization.searchParams.set("prompt", "select_account");

  if (["UNLINK", "SET_PASSWORD", "DELETE"].includes(input.intent)) {
    authorization.searchParams.set("max_age", "300");
    authorization.searchParams.set(
      "claims",
      JSON.stringify({ id_token: { auth_time: { essential: true } } }),
    );
  }

  const response = NextResponse.redirect(authorization, 303);
  response.cookies.set(GOOGLE_OAUTH_COOKIE, googleOAuthBrowserBinding(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(loadConfig().app.site_url).protocol === "https:",
    path: "/api/auth/google/callback",
    maxAge: 10 * 60,
  });
  return response;
}

/** Sign-in is safe to initiate from a normal link. No destructive intent is read from GET. */
export async function GET(request: NextRequest) {
  const canonical = canonicalRequest(request);
  if (canonical) return canonical;
  return beginGoogleAuthorization(request, {
    intent: "SIGN_IN",
    customer: null,
    pendingPasswordHash: null,
  });
}

/**
 * Account-security operations require an authenticated, same-origin form POST.
 * A cross-site top-level GET can therefore never arm deletion or credentials.
 */
export async function POST(request: NextRequest) {
  const canonical = canonicalRequest(request);
  if (canonical) {
    const { locale } = requestDestination(request);
    return NextResponse.redirect(
      new URL(localePath(locale, "/account"), loadConfig().app.site_url),
      303,
    );
  }
  if (!accountsEnabled()) return new NextResponse(null, { status: 404 });
  if (!isSameOrigin(request)) return new NextResponse(null, { status: 403 });

  const { locale } = requestDestination(request);
  const customer = await getCustomer();
  if (!customer) {
    const next = encodeURIComponent(localePath(locale, "/account"));
    return NextResponse.redirect(
      new URL(`${localePath(locale, "/account/sign-in")}?next=${next}`, request.url),
      303,
    );
  }

  const gate = await consumeRateLimit(`google-operation:${customer.id}`, 10, 900);
  if (!gate.allowed) {
    return accountRedirect(request, locale, "oauth=rateLimited");
  }

  const form = await request.formData().catch(() => null);
  const operation = String(form?.get("operation") ?? "");

  if (operation === "link") {
    if (customer.googleLinked) return accountRedirect(request, locale, "linked=1");
    const currentPassword = String(form?.get("currentPassword") ?? "");
    const row = await prisma.customer.findUnique({
      where: { id: customer.id },
      select: { passwordHash: true, sessionVersion: true },
    });
    if (
      !row?.passwordHash ||
      row.sessionVersion !== customer.sessionVersion ||
      !(await verifyPassword(currentPassword, row.passwordHash))
    ) {
      return accountRedirect(request, locale, "oauth=badCurrentPassword");
    }
    return beginGoogleAuthorization(request, {
      intent: "LINK",
      customer,
      pendingPasswordHash: null,
    });
  }

  if (operation === "unlink") {
    if (!customer.googleLinked || !customer.hasPassword) {
      return accountRedirect(request, locale, "oauth=lastSignInMethod");
    }
    return beginGoogleAuthorization(request, {
      intent: "UNLINK",
      customer,
      pendingPasswordHash: null,
    });
  }

  if (operation === "set-password") {
    if (!customer.googleLinked || customer.hasPassword) {
      return accountRedirect(request, locale, "oauth=invalid");
    }
    const parsed = passwordSetSchema.safeParse({ newPassword: form?.get("newPassword") });
    if (!parsed.success) return accountRedirect(request, locale, "password=invalid");

    return beginGoogleAuthorization(request, {
      intent: "SET_PASSWORD",
      customer,
      pendingPasswordHash: await hashPassword(parsed.data.newPassword),
    });
  }

  if (operation === "delete") {
    if (!customer.googleLinked) return accountRedirect(request, locale, "oauth=invalid");
    const typed = String(form?.get("confirm") ?? "").trim().toLowerCase();
    if (typed !== "delete" && typed !== "நீக்கு") {
      return accountRedirect(request, locale, "problem=confirm");
    }
    return beginGoogleAuthorization(request, {
      intent: "DELETE",
      customer,
      pendingPasswordHash: null,
    });
  }

  return accountRedirect(request, locale, "oauth=invalid");
}
