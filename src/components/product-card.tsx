import Link from "next/link";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatMoney } from "@/lib/money";
import type { ProductSummary } from "@/lib/products";

export function ProductCard({ product }: { product: ProductSummary }) {
  const inStock = product.stock > 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-bark-200/70 bg-white transition-shadow hover:shadow-md">
      <Link
        href={`/products/${product.slug}`}
        className="flex h-36 items-center justify-center bg-leaf-50 text-5xl"
        aria-hidden
      >
        {product.emoji ?? "\u{1F331}"}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs uppercase tracking-wide text-leaf-700">{product.category.name}</p>

        <h3 className="font-medium leading-snug">
          <Link href={`/products/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>

        <p className="line-clamp-2 text-sm text-bark-600">{product.description}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <div>
            <p className="font-semibold">{formatMoney(product.priceCents)}</p>
            <p className="text-xs text-bark-600">per {product.unit}</p>
          </div>

          <AddToCartButton
            inStock={inStock}
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              unit: product.unit,
              emoji: product.emoji,
            }}
          />
        </div>
      </div>
    </article>
  );
}
