import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { loadConfig } from "@conf/config";
import { getRedis, redisKey } from "./redis";

const TTL_SECONDS = 30 * 60;

/**
 * Password-reset tokens.
 *
 * Held in Redis rather than the database: they are short-lived, single-use and
 * worthless once spent, and an expiry is exactly what a TTL is for. Only the
 * SHA-256 of the token is stored, so a Redis dump cannot be used to reset
 * anyone's password.
 */
const memory = new Map<string, { customerId: string; expiresAt: number }>();

function keyFor(token: string): string {
  return redisKey("pwreset", createHash("sha256").update(token).digest("hex"));
}

export async function issueResetToken(customerId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const redis = getRedis();

  if (redis) {
    await redis.set(keyFor(token), customerId, "EX", TTL_SECONDS);
  } else {
    memory.set(keyFor(token), { customerId, expiresAt: Date.now() + TTL_SECONDS * 1000 });
  }

  return token;
}

/** Single use: the token is consumed whether or not the caller succeeds after. */
export async function consumeResetToken(token: string): Promise<string | null> {
  const key = keyFor(token);
  const redis = getRedis();

  if (redis) {
    const customerId = await redis.get(key).catch(() => null);
    if (customerId) await redis.del(key).catch(() => 0);
    return customerId;
  }

  const entry = memory.get(key);
  memory.delete(key);
  return entry && entry.expiresAt > Date.now() ? entry.customerId : null;
}

function mailConfigured(): boolean {
  const { mail } = loadConfig();
  return Boolean(mail.host && mail.from);
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
  const { mail, app } = loadConfig();

  if (!mailConfigured()) {
    if (app.env === "dev") {
      console.info(`[password-reset] ${to}\n${url}`);
      return;
    }
    throw new Error("mail is not configured");
  }

  // Imported lazily: nothing else in the app sends mail, and this keeps the
  // SMTP client out of every other server bundle.
  const { createTransport } = await import("nodemailer");
  const transport = createTransport({
    host: mail.host,
    port: mail.port,
    secure: mail.port === 465,
    auth: mail.user ? { user: mail.user, pass: mail.password } : undefined,
  });

  await transport.sendMail({
    to,
    from: mail.from,
    subject,
    text: `${body}\n\n${url}\n`,
  });
}
