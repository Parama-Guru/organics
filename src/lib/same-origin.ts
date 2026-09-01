import type { NextRequest } from "next/server";

/**
 * Reject a cross-origin write.
 *
 * A missing Origin header is allowed through: same-origin form posts and
 * server-to-server calls omit it, and every one of these routes has its own
 * rate limit and schema behind this. Shared rather than copied per route —
 * three near-identical copies of a security check is how one of them ends up
 * subtly weaker than the others.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
