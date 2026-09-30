import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";
import { recordVisitor, visitorDay } from "@/lib/visitor-counts";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "private, no-store" };
  if (request.headers.get("origin") !== request.nextUrl.origin || request.headers.get("x-ossil-visit") !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
  }
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1" ||
      /bot|crawler|spider|headless/i.test(request.headers.get("user-agent") ?? "")) {
    return new NextResponse(null, { status: 204, headers });
  }
  const limit = rateLimit(`visitors:${clientKeyFromHeaders(request.headers)}`, 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  const previous = request.cookies.get("ossil_visitor")?.value;
  const token = previous && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(previous)
    ? previous : randomUUID();
  try {
    const counts = await prisma.$transaction((transaction) => recordVisitor(transaction, token, visitorDay()));
    const response = NextResponse.json(counts, { headers });
    response.cookies.set("ossil_visitor", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: "/", maxAge: 365 * 24 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Counts unavailable" }, { status: 503, headers });
  }
}