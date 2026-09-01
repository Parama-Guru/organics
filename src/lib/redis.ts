import "server-only";

import Redis from "ioredis";

import { loadConfig } from "@conf/config";

/**
 * One client per process, kept on `globalThis` so Turbopack's module reloading
 * in dev does not open a new connection on every edit — the same reason
 * lib/prisma.ts does it.
 */
const globalForRedis = globalThis as unknown as { redis?: Redis | null };

export function getRedis(): Redis | null {
  const { redis } = loadConfig();
  if (!redis.url) return null;
  if (globalForRedis.redis !== undefined) return globalForRedis.redis;

  const client = new Redis(redis.url, {
    // Without this the constructor connects eagerly and an unreachable Redis
    // throws during module evaluation, which takes the whole route down.
    lazyConnect: true,
    // Bounded, so a command against a dead instance fails in about a second
    // rather than hanging the request.
    maxRetriesPerRequest: 2,
    connectTimeout: 5_000,
    // The first request after a cold start arrives while the socket is still
    // opening. Rejecting those made /api/health report degraded on boot; queued,
    // they run a few milliseconds later.
    enableOfflineQueue: true,
  });

  // An unhandled 'error' event on an ioredis client crashes the process.
  client.on("error", (error) => {
    console.error("[redis]", error.message);
  });

  client.connect().catch((error: Error) => {
    console.error("[redis] initial connect failed:", error.message);
  });

  globalForRedis.redis = client;
  return client;
}

export function redisKey(...parts: string[]): string {
  return loadConfig().redis.key_prefix + parts.join(":");
}
