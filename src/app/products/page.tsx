import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop",
  description: "Browse the full range of certified organic produce, dairy and pantry staples.",
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const params = await searchParams;
  const categorySlug = firstValue(params.category)?.slice(0, 100);
  const search = firstValue(params.search)?.slice(0, 100);

  const [products, categories] = await Promise.all([
    getProducts({ categorySlug, search }),
    getCategories(),
  ]);

  const activeCategory = categories.find((category) => category.slug === categorySlug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold">{activeCategory?.name ?? "All produce"}</h1>
      <p className="mt-2 text-bark-600">
        {activeCategory?.description ?? "Everything we are harvesting and stocking right now."}
      </p>

      <form method="get" className="mt-6 flex max-w-md gap-2" role="search">
        {categorySlug ? <input type="hidden" name="category" value={categorySlug} /> : null}
        <input
          type="search"
          name="search"
          defaultValue={search ?? ""}
          maxLength={100}
          placeholder="Search produce"
          aria-label="Search produce"
          className="w-full rounded-full border border-bark-200 bg-white px-4 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-leaf-700 px-5 py-2 text-sm font-medium text-white hover:bg-leaf-800"
        >
          Search
        </button>
      </form>

      <nav aria-label="Categories" className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/products"
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            categorySlug
              ? "border-bark-200 bg-white text-bark-600 hover:border-leaf-300"
              : "border-leaf-600 bg-leaf-100 text-leaf-800"
          }`}
        >
          All
        </Link>
        {categories.map((category) => {
          const active = category.slug === categorySlug;
          return (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                active
                  ? "border-leaf-600 bg-leaf-100 text-leaf-800"
                  : "border-bark-200 bg-white text-bark-600 hover:border-leaf-300"
              }`}
            >
              {category.name}
            </Link>
          );
        })}
      </nav>

      {products.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-bark-200 bg-white p-10 text-center text-bark-600">
          Nothing matches that search yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
