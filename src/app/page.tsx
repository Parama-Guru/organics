import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { getCategories, getFeaturedProducts } from "@/lib/products";

// The catalog lives in Postgres, which is not reachable while the Docker image builds.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([getFeaturedProducts(), getCategories()]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Indigo carries the hero, marigold is the accent, leaf stays for produce. */}
      <section className="relative mt-10 animate-rise overflow-hidden rounded-3xl bg-bark-900 px-5 py-12 text-white sm:px-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-marigold-500/25 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-leaf-500/25 blur-2xl"
        />

        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full bg-marigold-500 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-bark-900">
            Certified organic
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight xs:text-4xl sm:text-5xl">
            Real food, grown the <span className="text-marigold-400">slow way</span>.
          </h1>
          <p className="mt-4 max-w-xl text-bark-100">
            We buy direct from certified organic farms and deliver within hours of harvest. No
            synthetic pesticides, no waxes, no cold-storage months.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-block rounded-full bg-marigold-500 px-6 py-3 font-medium text-bark-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-marigold-400"
            >
              Shop the harvest
            </Link>
            <Link
              href="/products?region=Nilgiris"
              className="inline-block rounded-full border-2 border-white/70 px-6 py-3 font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-bark-900"
            >
              Browse by region
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold">
          Shop by category
          <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-marigold-500" />
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              style={{ animationDelay: `${index * 60}ms` }}
              className="animate-rise rounded-2xl border border-bark-200/70 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-marigold-400 hover:shadow-lg"
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
          <h2 className="text-2xl font-semibold">
            This week&apos;s pick
            <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-leaf-500" />
          </h2>
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
            {featured.map((product, index) => (
              <div key={product.id} style={{ animationDelay: `${index * 70}ms` }} className="animate-rise">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
