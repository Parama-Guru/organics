import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { getRedis, redisKey } from "./redis";

/**
 * Server-side session records.
 *
 * A stateless signed token cannot be revoked before it expires, so "sign out on
 * every device" and "suspend this account" would both be lies. The cookie
 * carries only an opaque id; everything else lives here.
 *
 * Redis is the real store. When it is not configured the process falls back to
 * a Map, which is fine for one dev container and is refused outright in prod by
 * conf/config.ts.
 */

export type SessionRecord = {
  customerId: string;
  createdAt: number;
  // Customer sessions set this; farmer sessions intentionally do not use the
  // customer credential-version boundary.
  sessionVersion?: number;
};

const memory = new Map<string, { value: string; expiresAt: number }>();

function sweepMemory(now: number): void {
  for (const [key, entry] of memory) {
    if (entry.expiresAt <= now) memory.delete(key);
  }
}

// The cookie value is the lookup key, so anyone reading a Redis dump could
// otherwise replay live sessions. Storing the digest makes the dump useless.
function storageKey(sessionId: string): string {
  return redisKey("session", createHash("sha256").update(sessionId).digest("hex"));
}

export function newSessionId(): string {
  return randomBytes(32).toString("base64url");
}

export async function putSession(
  sessionId: string,
  record: SessionRecord,
  ttlSeconds: number,
): Promise<void> {
  const key = storageKey(sessionId);
  const value = JSON.stringify(record);
  const redis = getRedis();

  if (redis) {
    await redis.set(key, value, "EX", ttlSeconds);
    return;
  }

  sweepMemory(Date.now());
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function readSession(sessionId: string): Promise<SessionRecord | null> {
  const key = storageKey(sessionId);
  const redis = getRedis();

  let raw: string | null | undefined;
  if (redis) {
    raw = await redis.get(key).catch(() => null);
  } else {
    const entry = memory.get(key);
    raw = entry && entry.expiresAt > Date.now() ? entry.value : null;
  }

  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionRecord;
  } catch {
    return null;
  }
}

export async function dropSession(sessionId: string): Promise<void> {
  const key = storageKey(sessionId);
  const redis = getRedis();
  if (redis) {
    await redis.del(key).catch(() => 0);
    return;
  }
  memory.delete(key);
}

/** Explicit sign-out must know whether the shared revocation actually landed. */
export async function dropSessionStrict(sessionId: string): Promise<void> {
  const key = storageKey(sessionId);
  const redis = getRedis();
  if (redis) {
    await redis.del(key);
    return;
  }
  memory.delete(key);
}

/**
 * Fixed-window counter. Returns how many hits remain and when the window
 * resets. Shared across instances when Redis is present, which is the point:
 * a per-process limiter lets an attacker get N attempts per replica.
 */
export async function consumeRateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const key = redisKey("rl", bucket);
  const redis = getRedis();

  if (redis) {
    try {
      const [count, ttl] = (await redis.eval(
        "local c=redis.call('INCR',KEYS[1]); local ttl=redis.call('TTL',KEYS[1]); if c==1 or ttl<0 then redis.call('EXPIRE',KEYS[1],ARGV[1]); ttl=tonumber(ARGV[1]); end; return {c,ttl}",
        1,
        key,
        windowSeconds,
      )) as [number, number];
      if (count <= limit) return { allowed: true, retryAfterSeconds: 0 };
      return { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds };
    } catch {
      // Fall through to the in-process bucket. It is weaker across replicas,
      // but never silently removes authentication throttling during Redis loss.
    }
  }

  const now = Date.now();
  sweepMemory(now);
  const entry = memory.get(key);

  if (!entry || entry.expiresAt <= now) {
    memory.set(key, { value: "1", expiresAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const count = Number(entry.value) + 1;
  entry.value = String(count);
  if (count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.expiresAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}
