import { NextResponse, type NextRequest } from "next/server";

import { getProducts, type ProductSummary } from "@/lib/products";
import { allowedSort, productQuerySchema } from "@/lib/product-query-schema";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";
import { sellerDetailsUnlocked } from "@/lib/seller-visibility";

export const dynamic = "force-dynamic";

type GuestProduct = Omit<ProductSummary, "priceCents">;

// The page hides the price behind sign-in, so the JSON has to drop the field
// rather than rely on nobody reading it.
function withoutPrice(product: ProductSummary): GuestProduct {
  const guest: GuestProduct & { priceCents?: number } = { ...product };
  delete guest.priceCents;
  return guest;
}

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

  const priceVisible = await sellerDetailsUnlocked();

  const products = await getProducts({
    categorySlug: parsed.data.category,
    region: parsed.data.region,
    search: parsed.data.search,
    sort: allowedSort(parsed.data.sort ?? "name", priceVisible),
    limit: parsed.data.limit,
  });

  // The page hides the price behind sign-in, so the JSON has to drop the field
  // rather than rely on nobody reading it.
  return NextResponse.json({
    products: priceVisible ? products : products.map(withoutPrice),
  });
}
