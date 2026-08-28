import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatMoney } from "@/lib/money";
import type { ProductSummary } from "@/lib/products";

export function ProductCard({ product }: { product: ProductSummary }) {
  const inStock = product.stock > 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-soft backdrop-blur-md transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-marigold-400/70 hover:shadow-lift">
      {/* Decorative duplicate of the title link, so it is kept out of the a11y tree. */}
      <Link
        href={`/products/${product.slug}`}
        className="relative flex h-36 items-center justify-center overflow-hidden bg-leaf-50 text-5xl"
        aria-hidden
        tabIndex={-1}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          (product.emoji ?? "\u{1F331}")
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-leaf-700">
          {product.category.name}
          {product.region ? <span className="text-bark-600"> &middot; {product.region}</span> : null}
        </p>

        <h3 className="font-display text-lg leading-snug break-words">
          <Link
            href={`/products/${product.slug}`}
            className="decoration-marigold-500 decoration-2 underline-offset-4 hover:underline"
          >
            {product.name}
          </Link>
        </h3>

        <p className="line-clamp-2 text-sm text-bark-600">{product.description}</p>

        {product.farmer ? (
          <p className="text-xs text-bark-600">
            Listed by <span className="font-semibold text-bark-900">{product.farmer.farmName}</span>
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-bark-200/60 pt-3">
          <div>
            <p className="font-display text-xl leading-none">
              {formatMoney(product.priceCents)}
            </p>
            <p className="mt-1 text-xs text-bark-600">per {product.unit}</p>
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
