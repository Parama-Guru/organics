import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { indiaDateInputValue, startOfIndiaDate } from "@/lib/india-date";
import { prisma } from "@/lib/prisma";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";
import { readBoundedJson } from "@/lib/request-body";
import { isSameOrigin } from "@/lib/same-origin";
import { consumeRateLimit } from "@/lib/session-store";
import { publicStoreWhere } from "@/lib/stores";

export const dynamic = "force-dynamic";

const eventSchema = z.object({
  placementId: z.string().min(1).max(60),
  event: z.enum(["IMPRESSION", "CLICK"]),
});

function empty(status = 204): NextResponse {
  return new NextResponse(null, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return empty(403);

  const body = await readBoundedJson(request, 1_024);
  if (!body.ok) return empty(body.tooLarge ? 413 : 400);

  const parsed = eventSchema.safeParse(body.value);
  if (!parsed.success) return empty(400);

  const client = clientKeyFromHeaders(request.headers);
  const { placementId, event } = parsed.data;
  const [shared, perPlacement] = await Promise.all([
    consumeRateLimit(`sponsored-metric:${event}:${client}`, 1_000, 3_600),
    consumeRateLimit(`sponsored-metric:${event}:${placementId}:${client}`, 60, 3_600),
  ]);
  const local = rateLimit(`sponsored-metric:${event}:${client}`, 1_000, 3_600_000);
  if (!shared.allowed || !perPlacement.allowed || !local.allowed) return empty(429);

  const now = new Date();
  const placement = await prisma.sponsoredPlacement.findFirst({
    where: {
      id: placementId,
      status: "ACTIVE",
      startsAt: { lte: now },
      endsAt: { gt: now },
      OR: [
        { farmer: { status: "VERIFIED", certifiedUntil: { gte: now } } },
        { store: publicStoreWhere(now) },
      ],
    },
    select: { id: true },
  });
  // An old page can report after a placement ends. Ignore it without exposing
  // whether a private placement id ever existed.
  if (!placement) return empty();

  const date = startOfIndiaDate(indiaDateInputValue(now));
  if (!date) return empty();

  await prisma.sponsoredMetric.upsert({
    where: { placementId_date: { placementId, date } },
    create: {
      placementId,
      date,
      impressions: event === "IMPRESSION" ? 1 : 0,
      clicks: event === "CLICK" ? 1 : 0,
    },
    update:
      event === "IMPRESSION"
        ? { impressions: { increment: 1 } }
        : { clicks: { increment: 1 } },
  });

  return empty();
}
