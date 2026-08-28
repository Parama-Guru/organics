import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { getCategories, getFeaturedProducts } from "@/lib/products";

// The catalog lives in Postgres, which is not reachable while the Docker image builds.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([getFeaturedProducts(), getCategories()]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="mt-10 overflow-hidden rounded-3xl bg-leaf-700 px-5 py-10 text-white sm:px-12 sm:py-14">
        <p className="text-sm uppercase tracking-widest text-leaf-100">Certified organic</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight xs:text-4xl sm:text-5xl">
          Real food, grown the slow way.
        </h1>
        <p className="mt-4 max-w-xl text-leaf-100">
          We buy direct from certified organic farms and deliver within hours of harvest. No
          synthetic pesticides, no waxes, no cold-storage months.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-block rounded-full bg-marigold-500 px-6 py-3 font-medium text-bark-900 transition-colors hover:bg-marigold-400"
        >
          Shop the harvest
        </Link>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold">Shop by category</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="rounded-2xl border border-bark-200/70 bg-white p-5 transition-colors hover:border-leaf-300 hover:bg-leaf-50"
            >
              <h3 className="font-medium">{category.name}</h3>
              {category.description ? (
                <p className="mt-1 text-sm text-bark-600">{category.description}</p>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-2xl font-semibold">This week&apos;s pick</h2>
          <Link href="/products" className="text-sm text-leaf-700 hover:underline">
            View all
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-bark-200 bg-white p-8 text-center text-bark-600">
            The catalog is empty. Run <code className="font-mono">npm run db:seed</code> to load
            sample produce.
          </p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
