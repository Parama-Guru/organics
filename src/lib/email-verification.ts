import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { loadConfig } from "@conf/config";
import { redisKey, getRedis } from "./redis";
import { mailConfigured, sendTextEmail } from "./mail";

const TTL_SECONDS = 24 * 60 * 60;
const memory = new Map<string, { customerId: string; expiresAt: number }>();

function keyFor(token: string): string {
  return redisKey("emailverify", createHash("sha256").update(token).digest("hex"));
}

export async function issueEmailVerification(customerId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const key = keyFor(token);
  const redis = getRedis();
  if (redis) {
    await redis.set(key, customerId, "EX", TTL_SECONDS);
  } else {
    memory.set(key, { customerId, expiresAt: Date.now() + TTL_SECONDS * 1000 });
  }
  return token;
}

export async function consumeEmailVerification(token: string): Promise<string | null> {
  const key = keyFor(token);
  const redis = getRedis();
  if (redis) {
    return (await redis.eval(
      "local v=redis.call('GET',KEYS[1]); if v then redis.call('DEL',KEYS[1]); end; return v",
      1,
      key,
    )) as string | null;
  }

  const entry = memory.get(key);
  memory.delete(key);
  return entry && entry.expiresAt > Date.now() ? entry.customerId : null;
}

export function emailVerificationAvailable(): boolean {
  return mailConfigured() || loadConfig().app.env === "dev";
}

export async function sendEmailVerification({
  customerId,
  email,
  locale,
}: {
  customerId: string;
  email: string;
  locale: "ta" | "en";
}): Promise<void> {
  const token = await issueEmailVerification(customerId);
  const { app } = loadConfig();
  const query = new URLSearchParams({ token, locale });
  const url = `${app.site_url}/api/auth/verify-email?${query}`;

  if (!mailConfigured()) {
    if (app.env === "dev") console.info(`[email-verification] ${email}\n${url}`);
    return;
  }

  const subject = locale === "ta" ? "Organics மின்னஞ்சலைச் சரிபார்க்க" : "Verify your Organics email";
  const text = locale === "ta"
    ? `இந்த முகவரியை உங்கள் Organics கணக்குடன் இணைக்க கீழே உள்ள இணைப்பை 24 மணி நேரத்திற்குள் திறக்கவும்.\n\n${url}\n\nநீங்கள் கேட்கவில்லை என்றால் இதைப் புறக்கணிக்கவும்.`
    : `Open the link below within 24 hours to verify this address for your Organics account.\n\n${url}\n\nIf you did not request this, ignore it.`;
  await sendTextEmail({ to: email, subject, text });
}
