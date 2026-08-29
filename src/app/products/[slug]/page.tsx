import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingPanel } from "@/components/booking-panel";
import { ProductGallery } from "@/components/product-gallery";
import { Button } from "@/components/ui/button";
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
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-bark-600 transition-colors hover:text-bark-900"
      >
        <span aria-hidden>&larr;</span> Back to shop
      </Link>

      <div className="mt-6 grid animate-rise gap-8 sm:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} emoji={product.emoji} />

        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-leaf-700">
            {product.category.name}
            {product.region ? (
              <span className="text-bark-600"> &middot; grown in {product.region}</span>
            ) : null}
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight break-words sm:text-4xl">
            {product.name}
          </h1>

          <p className="mt-4 text-bark-600">{product.description}</p>

          <div className="mt-6 flex items-end gap-3">
            <p className="font-display text-3xl leading-none">
              {formatMoney(product.priceCents)}
            </p>
            <p className="pb-1 text-sm text-bark-600">per {product.unit}</p>
          </div>

          <p
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              inStock ? "bg-leaf-100 text-leaf-800" : "bg-bark-100 text-bark-600"
            }`}
          >
            {inStock ? `${product.stock} in stock` : "Currently unavailable"}
          </p>

          <Button as="a" href="#contact" size="lg" className="mt-6">
            {product.farmer ? `Contact ${product.farmer.farmName}` : "Contact us to order"}
            <span aria-hidden>&darr;</span>
          </Button>
        </div>
      </div>

      <BookingPanel
        productId={product.id}
        productName={product.name}
        unit={product.unit}
        farmer={product.farmer}
      />
    </div>
  );
}
