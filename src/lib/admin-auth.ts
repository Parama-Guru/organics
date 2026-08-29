import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { loadConfig } from "@conf/config";

export const ADMIN_COOKIE = "organics_admin";

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Token is `<expiry-ms>.<hmac>`, so there is no session store to keep in sync. */
export function issueSession(): { token: string; maxAge: number } {
  const { admin } = loadConfig();
  const maxAge = admin.session_ttl_minutes * 60;
  const payload = String(Date.now() + maxAge * 1000);
  return { token: `${payload}.${sign(payload, admin.session_secret)}`, maxAge };
}

function isValidToken(token: string | undefined): boolean {
  const { admin } = loadConfig();
  if (!token || !admin.session_secret) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = Buffer.from(sign(payload, admin.session_secret));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length) return false;
  if (!timingSafeEqual(expected, provided)) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

/** False when nothing is configured, so an unconfigured deploy stays shut rather than open. */
export function isAdminEnabled(): boolean {
  const { admin } = loadConfig();
  return Boolean(admin.password_hash && admin.session_secret);
}

export async function isSignedIn(): Promise<boolean> {
  if (!isAdminEnabled()) return false;
  const jar = await cookies();
  return isValidToken(jar.get(ADMIN_COOKIE)?.value);
}
