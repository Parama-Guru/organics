import { NextResponse, type NextRequest } from "next/server";

import { getProducts } from "@/lib/products";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";
import { productQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limit = rateLimit(`products:${clientKeyFromHeaders(request.headers)}`, 60, 60_000);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const parsed = productQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const products = await getProducts({
    categorySlug: parsed.data.category,
    search: parsed.data.search,
    limit: parsed.data.limit,
  });

  return NextResponse.json({ products });
}
