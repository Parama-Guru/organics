import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatMoney } from "@/lib/money";
import { getProductBySlug } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const inStock = product.stock > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/products" className="text-sm text-leaf-700 hover:underline">
        &larr; Back to shop
      </Link>

      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <div
          aria-hidden
          className="flex h-64 items-center justify-center rounded-3xl bg-leaf-50 text-8xl"
        >
          {product.emoji ?? "\u{1F331}"}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-leaf-700">{product.category.name}</p>
          <h1 className="mt-2 text-3xl font-semibold">{product.name}</h1>

          <p className="mt-4 text-bark-600">{product.description}</p>

          <p className="mt-6 text-2xl font-semibold">{formatMoney(product.priceCents)}</p>
          <p className="text-sm text-bark-600">per {product.unit}</p>

          <p className={`mt-3 text-sm ${inStock ? "text-leaf-700" : "text-bark-600"}`}>
            {inStock ? `${product.stock} in stock` : "Currently unavailable"}
          </p>

          <AddToCartButton
            className="mt-6"
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
    </div>
  );
}
