import { NextResponse } from "next/server";

import { accountsEnabled } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

// Used by Render/Docker health checks. Verifies the dependencies round-trip, not
// just that the process is alive.
export async function GET() {
  const [database, redis] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => "ok" as const).catch(() => "unreachable" as const),
    (async () => {
      const client = getRedis();
      if (!client) return "not-configured" as const;
      return client
        .ping()
        .then(() => "ok" as const)
        .catch(() => "unreachable" as const);
    })(),
  ]);

  // Redis holds the sessions, so an unreachable instance signs everyone out even
  // though pages still render. That is degraded, not healthy.
  const healthy = database === "ok" && (redis !== "unreachable" || !accountsEnabled());

  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", database, redis },
    { status: healthy ? 200 : 503 },
  );
}
