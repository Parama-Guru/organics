import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { loadConfig } from "@conf/config";
import { ensureCustomerSubscription } from "./customer-access";
import { prisma } from "./prisma";
import {
  dropSession,
  dropSessionStrict,
  newSessionId,
  putSession,
  readSession,
} from "./session-store";

export const CUSTOMER_COOKIE = "organics_session";

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

/**
 * Cookie value is `<session-id>.<hmac>`. The signature is not what authorises
 * the request — the server-side record is — but it means a forged or truncated
 * id is rejected without touching Redis.
 */
function unsignCookie(raw: string | undefined, secret: string): string | null {
  if (!raw) return null;
  const index = raw.lastIndexOf(".");
  if (index <= 0) return null;

  const id = raw.slice(0, index);
  const provided = Buffer.from(raw.slice(index + 1));
  const expected = Buffer.from(sign(id, secret));
  if (provided.length !== expected.length) return null;
  return timingSafeEqual(provided, expected) ? id : null;
}

/** False when nothing is configured, so the account area stays shut by default. */
export function accountsEnabled(): boolean {
  const { accounts } = loadConfig();
  return accounts.enabled && accounts.session_secret.length >= 32;
}

export type SignedInCustomer = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  region: { slug: string; name: string; nameTa: string | null } | null;
  locale: string;
  emailVerifiedAt: Date | null;
  profileCompletedAt: Date | null;
  hasPassword: boolean;
  googleLinked: boolean;
  sessionVersion: number;
};

export async function startSession(customerId: string, sessionVersion: number): Promise<void> {
  const { accounts, app } = loadConfig();
  const ttlSeconds = accounts.session_ttl_days * 86_400;
  const id = newSessionId();

  await ensureCustomerSubscription(customerId);
  await putSession(id, { customerId, createdAt: Date.now(), sessionVersion }, ttlSeconds);

  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, `${id}.${sign(id, accounts.session_secret)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(app.site_url).protocol === "https:",
    path: "/",
    maxAge: ttlSeconds,
  });
}

export async function endSession(): Promise<void> {
  const { accounts } = loadConfig();
  const jar = await cookies();
  const id = unsignCookie(jar.get(CUSTOMER_COOKIE)?.value, accounts.session_secret);

  // Delete the record first: clearing only the cookie would leave a live
  // session behind for anyone who had already copied the value.
  if (id) await dropSessionStrict(id);
  jar.delete(CUSTOMER_COOKIE);
}

export async function getCustomer(): Promise<SignedInCustomer | null> {
  if (!accountsEnabled()) return null;

  const { accounts } = loadConfig();
  const jar = await cookies();
  const id = unsignCookie(jar.get(CUSTOMER_COOKIE)?.value, accounts.session_secret);
  if (!id) return null;

  const record = await readSession(id);
  if (!record) return null;

  // Read through to the database every time. A cached copy would keep serving a
  // deleted or suspended account until its session expired.
  const customer = await prisma.customer.findFirst({
    where: { id: record.customerId, status: "ACTIVE" },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      locale: true,
      passwordHash: true,
      passwordSetAt: true,
      sessionVersion: true,
      emailVerifiedAt: true,
      profileCompletedAt: true,
      identities: { where: { provider: "GOOGLE" }, select: { id: true }, take: 1 },
      region: { select: { slug: true, name: true, nameTa: true } },
    },
  });

  if (!customer) return null;

  // Exact version equality closes the in-flight-login race that a wall-clock
  // timestamp cannot: a session always retains the version of the credential
  // it actually verified.
  if (record.sessionVersion !== customer.sessionVersion) {
    await dropSession(id);
    return null;
  }

  const { passwordHash, passwordSetAt, identities, ...safe } = customer;
  void passwordSetAt;
  return {
    ...safe,
    hasPassword: passwordHash !== null,
    googleLinked: identities.length > 0,
  };
}

export async function requireCustomer(): Promise<SignedInCustomer> {
  const customer = await getCustomer();
  if (!customer) throw new Error("NOT_SIGNED_IN");
  return customer;
}
