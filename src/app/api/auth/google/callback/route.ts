import { NextResponse, type NextRequest } from "next/server";
import * as oauth from "oauth4webapi";

import { deleteCustomerAccount } from "@/lib/customer-delete";
import { endSession, getCustomer, startSession } from "@/lib/customer-auth";
import {
  GOOGLE_AS,
  getGoogleCredentials,
  googleClient,
  googleRedirectUri,
} from "@/lib/google-auth";
import { DEFAULT_LOCALE, localePath, type Locale } from "@/lib/i18n/config";
import {
  GOOGLE_OAUTH_COOKIE,
  consumeGoogleOAuthState,
  type GoogleOAuthIntent,
  validGoogleOAuthBrowserBinding,
} from "@/lib/oauth-state";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function finish(response: NextResponse): NextResponse {
  response.cookies.delete({
    name: GOOGLE_OAUTH_COOKIE,
    path: "/api/auth/google/callback",
  });
  return response;
}

function authError(
  request: NextRequest,
  locale: Locale = DEFAULT_LOCALE,
  code = "invalid",
  next?: string,
  intent: GoogleOAuthIntent = "SIGN_IN",
) {
  if (intent !== "SIGN_IN" && code !== "session") {
    return finish(
      NextResponse.redirect(
        new URL(`${localePath(locale, "/account")}?oauth=${encodeURIComponent(code)}`, request.url),
        303,
      ),
    );
  }

  const query = new URLSearchParams({ oauth: code });
  if (next) query.set("next", next);
  return finish(
    NextResponse.redirect(
      new URL(`${localePath(locale, "/account/sign-in")}?${query}`, request.url),
      303,
    ),
  );
}

function isStepUpIntent(intent: GoogleOAuthIntent): boolean {
  return intent === "UNLINK" || intent === "SET_PASSWORD" || intent === "DELETE";
}

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  if (!state) return authError(request);

  const binding = request.cookies.get(GOOGLE_OAUTH_COOKIE)?.value;
  if (!validGoogleOAuthBrowserBinding(state, binding)) return authError(request);

  const stored = await consumeGoogleOAuthState(state).catch(() => null);
  if (!stored) return authError(request);

  const credentials = getGoogleCredentials();
  if (!credentials) {
    return authError(
      request,
      stored.locale,
      "unavailable",
      stored.next,
      stored.intent,
    );
  }

  try {
    const client = googleClient(credentials);
    const callbackParameters = oauth.validateAuthResponse(
      GOOGLE_AS,
      client,
      request.nextUrl.searchParams,
      state,
    );
    const tokenResponse = await oauth.authorizationCodeGrantRequest(
      GOOGLE_AS,
      client,
      oauth.ClientSecretPost(credentials.clientSecret),
      callbackParameters,
      googleRedirectUri(),
      stored.codeVerifier,
    );
    const tokens = await oauth.processAuthorizationCodeResponse(
      GOOGLE_AS,
      client,
      tokenResponse,
      {
        expectedNonce: stored.nonce,
        requireIdToken: true,
        ...(isStepUpIntent(stored.intent) ? { maxAge: 300 } : {}),
      },
    );
    const claims = oauth.getValidatedIdTokenClaims(tokens);
    const subject = claims?.sub;
    const email = typeof claims?.email === "string" ? claims.email.trim().toLowerCase() : "";
    if (!subject || !email || claims?.email_verified !== true) {
      return authError(
        request,
        stored.locale,
        "unverified",
        stored.next,
        stored.intent,
      );
    }

    const current = stored.intent !== "SIGN_IN" ? await getCustomer() : null;
    if (
      stored.intent !== "SIGN_IN" &&
      (!current ||
        current.id !== stored.customerId ||
        current.sessionVersion !== stored.sessionVersion)
    ) {
      return authError(request, stored.locale, "session", stored.next, stored.intent);
    }

    if (isStepUpIntent(stored.intent) && current) {
      const identity = await prisma.customerIdentity.findUnique({
        where: {
          provider_providerAccountId: {
            provider: "GOOGLE",
            providerAccountId: subject,
          },
        },
        select: { customerId: true },
      });
      if (identity?.customerId !== current.id) {
        return authError(
          request,
          stored.locale,
          "wrongGoogle",
          stored.next,
          stored.intent,
        );
      }

      if (stored.intent === "DELETE") {
        const deleted = await deleteCustomerAccount(
          current.id,
          stored.sessionVersion ?? undefined,
        );
        if (!deleted.ok) {
          return authError(
            request,
            stored.locale,
            "billing",
            stored.next,
            stored.intent,
          );
        }
        await endSession();
        return finish(
          NextResponse.redirect(
            new URL(`${localePath(stored.locale, "/")}?deleted=1`, request.url),
            303,
          ),
        );
      }

      if (stored.intent === "SET_PASSWORD") {
        if (!stored.pendingPasswordHash ||
            !/^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/.test(stored.pendingPasswordHash)) {
          return authError(request, stored.locale, "invalid", stored.next, stored.intent);
        }

        const changed = await prisma.customer.updateMany({
          where: {
            id: current.id,
            status: "ACTIVE",
            passwordHash: null,
            sessionVersion: stored.sessionVersion ?? -1,
          },
          data: {
            passwordHash: stored.pendingPasswordHash,
            passwordSetAt: new Date(),
            sessionVersion: { increment: 1 },
          },
        });
        if (changed.count !== 1) {
          return authError(request, stored.locale, "invalid", stored.next, stored.intent);
        }

        const updated = await prisma.customer.findUniqueOrThrow({
          where: { id: current.id },
          select: { sessionVersion: true },
        });
        await endSession();
        await startSession(current.id, updated.sessionVersion);
        return finish(
          NextResponse.redirect(
            new URL(`${localePath(stored.locale, "/account")}?passwordAdded=1`, request.url),
            303,
          ),
        );
      }

      if (stored.intent === "UNLINK") {
        if (!current.hasPassword) {
          return authError(
            request,
            stored.locale,
            "lastSignInMethod",
            stored.next,
            stored.intent,
          );
        }
        const updated = await prisma.$transaction(async (tx) => {
          const version = await tx.customer.updateMany({
            where: {
              id: current.id,
              status: "ACTIVE",
              sessionVersion: stored.sessionVersion ?? -1,
              passwordHash: { not: null },
            },
            data: { sessionVersion: { increment: 1 } },
          });
          if (version.count !== 1) throw new Error("STALE_GOOGLE_STEP_UP");
          const deleted = await tx.customerIdentity.deleteMany({
            where: {
              customerId: current.id,
              provider: "GOOGLE",
              providerAccountId: subject,
            },
          });
          if (deleted.count !== 1) throw new Error("STALE_GOOGLE_IDENTITY");
          return tx.customer.findUniqueOrThrow({
            where: { id: current.id },
            select: { sessionVersion: true },
          });
        }).catch(() => null);
        if (!updated) {
          return authError(request, stored.locale, "invalid", stored.next, stored.intent);
        }
        await endSession();
        await startSession(current.id, updated.sessionVersion);
        return finish(
          NextResponse.redirect(
            new URL(`${localePath(stored.locale, "/account")}?unlinked=1`, request.url),
            303,
          ),
        );
      }
    }

    const existingIdentity = await prisma.customerIdentity.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "GOOGLE",
          providerAccountId: subject,
        },
      },
      select: { customerId: true },
    });

    let customerId: string;
    let newCustomer = false;

    if (existingIdentity) {
      if (stored.intent === "LINK" && existingIdentity.customerId !== stored.customerId) {
        return authError(
          request,
          stored.locale,
          "alreadyLinked",
          stored.next,
          stored.intent,
        );
      }
      customerId = existingIdentity.customerId;
      await prisma.customerIdentity.update({
        where: {
          provider_providerAccountId: {
            provider: "GOOGLE",
            providerAccountId: subject,
          },
        },
        data: { emailAtLink: email, lastUsedAt: new Date() },
      });
    } else if (stored.intent === "LINK" && stored.customerId) {
      const emailOwner = await prisma.customer.findUnique({
        where: { email },
        select: { id: true },
      });
      if (emailOwner && emailOwner.id !== stored.customerId) {
        return authError(
          request,
          stored.locale,
          "emailInUse",
          stored.next,
          stored.intent,
        );
      }
      customerId = stored.customerId;
      const linked = await prisma.$transaction(async (tx) => {
        const active = await tx.customer.count({
          where: {
            id: customerId,
            status: "ACTIVE",
            sessionVersion: stored.sessionVersion ?? -1,
            passwordHash: { not: null },
          },
        });
        if (active !== 1) throw new Error("STALE_GOOGLE_LINK");
        return tx.customerIdentity.create({
          data: {
            customerId,
            provider: "GOOGLE",
            providerAccountId: subject,
            emailAtLink: email,
            lastUsedAt: new Date(),
          },
        });
      }).catch(() => null);
      if (!linked) {
        return authError(request, stored.locale, "invalid", stored.next, stored.intent);
      }
    } else {
      const byEmail = await prisma.customer.findUnique({
        where: { email },
        select: { id: true },
      });
      if (byEmail) {
        // Email equality is not consent to change an existing account's sign-in
        // methods. Sign in with its password first, then use Link Google.
        return authError(
          request,
          stored.locale,
          "emailInUse",
          stored.next,
          stored.intent,
        );
      }

      newCustomer = true;
      const customer = await prisma.customer.create({
        data: {
          email,
          emailVerifiedAt: new Date(),
          passwordHash: null,
          name: email.split("@")[0] || email,
          locale: stored.locale,
          identities: {
            create: {
              provider: "GOOGLE",
              providerAccountId: subject,
              emailAtLink: email,
              lastUsedAt: new Date(),
            },
          },
        },
        select: { id: true },
      });
      customerId = customer.id;
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        status: "ACTIVE",
        ...(stored.intent === "SIGN_IN"
          ? {
              identities: {
                some: { provider: "GOOGLE", providerAccountId: subject },
              },
            }
          : {}),
      },
      select: { id: true, profileCompletedAt: true, sessionVersion: true },
    });
    if (!customer) {
      return authError(
        request,
        stored.locale,
        "unavailable",
        stored.next,
        stored.intent,
      );
    }

    const customerEmail = await prisma.customer.findUniqueOrThrow({
      where: { id: customer.id },
      select: { email: true },
    });
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        ...(customerEmail.email === email ? { emailVerifiedAt: new Date() } : {}),
        lastSeenAt: new Date(),
      },
    });
    await startSession(customer.id, customer.sessionVersion);

    const destination =
      newCustomer || !customer.profileCompletedAt
        ? `${localePath(stored.locale, "/account/onboarding")}?next=${encodeURIComponent(stored.next)}`
        : stored.intent === "LINK"
          ? `${localePath(stored.locale, "/account")}?linked=1`
          : stored.next;

    return finish(NextResponse.redirect(new URL(destination, request.url), 303));
  } catch (error) {
    console.error(
      `[auth] Google callback failed: ${error instanceof Error ? error.name : "UnknownError"}`,
    );
    return authError(
      request,
      stored.locale,
      "invalid",
      stored.next,
      stored.intent,
    );
  }
}
