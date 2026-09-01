import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { loadConfig } from "@conf/config";
import { getRedis, redisKey } from "./redis";
import { mailConfigured, sendTextEmail } from "./mail";

const TTL_SECONDS = 30 * 60;

/**
 * Password-reset tokens.
 *
 * Held in Redis rather than the database: they are short-lived, single-use and
 * worthless once spent, and an expiry is exactly what a TTL is for. Only the
 * SHA-256 of the token is stored, so a Redis dump cannot be used to reset
 * anyone's password.
 */
type ResetGrant = { customerId: string; sessionVersion: number };

const memory = new Map<string, { value: ResetGrant; expiresAt: number }>();

function keyFor(token: string): string {
  return redisKey("pwreset", createHash("sha256").update(token).digest("hex"));
}

export async function issueResetToken(
  customerId: string,
  sessionVersion: number,
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const redis = getRedis();
  const value: ResetGrant = { customerId, sessionVersion };

  if (redis) {
    await redis.set(keyFor(token), JSON.stringify(value), "EX", TTL_SECONDS);
  } else {
    memory.set(keyFor(token), { value, expiresAt: Date.now() + TTL_SECONDS * 1000 });
  }

  return token;
}

/** Single use: the token is consumed whether or not the caller succeeds after. */
export async function consumeResetToken(token: string): Promise<ResetGrant | null> {
  const key = keyFor(token);
  const redis = getRedis();

  if (redis) {
    const raw = (await redis
      .eval(
        "local v=redis.call('GET',KEYS[1]); if v then redis.call('DEL',KEYS[1]); end; return v",
        1,
        key,
      )
      .catch(() => null)) as string | null;
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<ResetGrant>;
      return typeof parsed.customerId === "string" && Number.isInteger(parsed.sessionVersion)
        ? { customerId: parsed.customerId, sessionVersion: parsed.sessionVersion! }
        : null;
    } catch {
      return null;
    }
  }

  const entry = memory.get(key);
  memory.delete(key);
  return entry && entry.expiresAt > Date.now() ? entry.value : null;
}

/**
 * Reset is offered when mail can be sent, and additionally in development,
 * where the link is written to the server log so the flow can be exercised
 * without an SMTP account. Never in production.
 */
export function resetAvailable(): boolean {
  return mailConfigured() || loadConfig().app.env === "dev";
}

export async function sendResetEmail(to: string, url: string, subject: string, body: string) {
  const { app } = loadConfig();

  if (!mailConfigured()) {
    if (app.env === "dev") {
      console.info(`[password-reset] ${to}\n${url}`);
      return;
    }
    throw new Error("mail is not configured");
  }

  await sendTextEmail({
    to,
    subject,
    text: `${body}\n\n${url}\n`,
  });
}
