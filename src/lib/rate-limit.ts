import { loadConfig } from "@conf/config";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

// In-memory and therefore per-instance. Adequate for a single container; move to
// Redis if the service is scaled to multiple replicas.
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) prune(now);

  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds };
}

/**
 * The client's IP as seen by our own edge.
 *
 * X-Forwarded-For is append-only: anything a client sends arrives on the LEFT
 * and the proxy appends the socket address on the RIGHT. Reading the left-most
 * entry — the obvious-looking choice — lets anyone reset their own rate limit
 * by sending a header, which is exactly what happened here: six failed admin
 * sign-ins, then `X-Forwarded-For: 203.0.113.9` and the limit was gone.
 *
 * So: read from the right. trusted_proxy_hops is how many proxy entries we
 * deliberately skip from that side. A value of 0 means direct mode and ignores
 * the forwarded header entirely.
 */
export function clientKeyFromHeaders(headers: Headers): string {
  const trustedProxyHops = loadConfig().app.trusted_proxy_hops;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded && trustedProxyHops > 0) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    const trusted = hops[hops.length - trustedProxyHops] ?? hops[0];
    if (trusted) return trusted;
  }

  // Only reachable when the platform sets no X-Forwarded-For at all, which in
  // practice means local development.
  return headers.get("x-real-ip")?.trim() || "unknown";
}
