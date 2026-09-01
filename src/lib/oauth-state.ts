import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { loadConfig } from "@conf/config";

import type { Locale } from "./i18n/config";
import { getRedis, redisKey } from "./redis";

const TTL_SECONDS = 10 * 60;
export const GOOGLE_OAUTH_COOKIE = "organics_google_oauth";

export type GoogleOAuthIntent =
  | "SIGN_IN"
  | "LINK"
  | "UNLINK"
  | "SET_PASSWORD"
  | "DELETE";

export type GoogleOAuthState = {
  codeVerifier: string;
  nonce: string;
  locale: Locale;
  next: string;
  intent: GoogleOAuthIntent;
  customerId: string | null;
  sessionVersion: number | null;
  pendingPasswordHash: string | null;
};

const memory = new Map<string, { value: GoogleOAuthState; expiresAt: number }>();

function keyFor(state: string): string {
  return redisKey("oauth:google", createHash("sha256").update(state).digest("hex"));
}

function browserBinding(state: string): string {
  return createHmac("sha256", loadConfig().accounts.session_secret)
    .update(state)
    .digest("base64url");
}

export function googleOAuthBrowserBinding(state: string): string {
  return browserBinding(state);
}

export function validGoogleOAuthBrowserBinding(
  state: string,
  provided: string | undefined,
): boolean {
  if (!provided) return false;
  const expected = Buffer.from(browserBinding(state));
  const actual = Buffer.from(provided);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function putGoogleOAuthState(
  state: string,
  value: GoogleOAuthState,
): Promise<void> {
  const key = keyFor(state);
  const redis = getRedis();
  if (redis) {
    await redis.set(key, JSON.stringify(value), "EX", TTL_SECONDS);
    return;
  }
  memory.set(key, { value, expiresAt: Date.now() + TTL_SECONDS * 1000 });
}

/** Read-and-delete in one Redis command so a callback cannot be replayed. */
export async function consumeGoogleOAuthState(
  state: string,
): Promise<GoogleOAuthState | null> {
  const key = keyFor(state);
  const redis = getRedis();
  let raw: string | null;

  if (redis) {
    raw = (await redis.eval(
      "local v=redis.call('GET',KEYS[1]); if v then redis.call('DEL',KEYS[1]); end; return v",
      1,
      key,
    )) as string | null;
  } else {
    const entry = memory.get(key);
    memory.delete(key);
    if (!entry || entry.expiresAt <= Date.now()) return null;
    return entry.value;
  }

  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<GoogleOAuthState>;
    if (
      typeof value.codeVerifier !== "string" ||
      typeof value.nonce !== "string" ||
      (value.locale !== "ta" && value.locale !== "en") ||
      typeof value.next !== "string" ||
      !["SIGN_IN", "LINK", "UNLINK", "SET_PASSWORD", "DELETE"].includes(
        value.intent ?? "",
      ) ||
      (value.customerId !== null && typeof value.customerId !== "string") ||
      (value.sessionVersion !== null && !Number.isInteger(value.sessionVersion)) ||
      (value.pendingPasswordHash !== null &&
        typeof value.pendingPasswordHash !== "string")
    ) {
      return null;
    }
    return value as GoogleOAuthState;
  } catch {
    return null;
  }
}
