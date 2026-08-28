import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { getCategories, getProducts, getRegions } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop",
  description: "Browse the full range of certified organic produce, dairy and pantry staples.",
};

type Filters = { category?: string; region?: string; search?: string };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Filters compose, so every link has to carry the ones it is not changing.
function hrefWith(current: Filters, patch: Filters): string {
  const next = { ...current, ...patch };
  const query = new URLSearchParams();

  for (const key of ["category", "region", "search"] as const) {
    const value = next[key];
    if (value) query.set(key, value);
  }

  const qs = query.toString();
  return qs ? `/products?${qs}` : "/products";
}

function Chip({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active
          ? "border-leaf-600 bg-leaf-100 text-leaf-800"
          : "border-bark-200 bg-white text-bark-600 hover:border-leaf-300"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const params = await searchParams;
  const filters: Filters = {
    category: firstValue(params.category)?.slice(0, 100),
    region: firstValue(params.region)?.slice(0, 100),
    search: firstValue(params.search)?.slice(0, 100),
  };

  const [products, categories, regions] = await Promise.all([
    getProducts({
      categorySlug: filters.category,
      region: filters.region,
      search: filters.search,
    }),
    getCategories(),
    getRegions(),
  ]);

  const activeCategory = categories.find((category) => category.slug === filters.category);
  const isFiltered = Boolean(filters.category || filters.region || filters.search);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold">
        {activeCategory?.name ?? "All produce"}
        {filters.region ? <span className="text-bark-600"> from {filters.region}</span> : null}
      </h1>
      <p className="mt-2 text-bark-600">
        {activeCategory?.description ?? "Everything we are harvesting and stocking right now."}
      </p>

      <form method="get" className="mt-6 flex max-w-md gap-2" role="search">
        {filters.category ? (
          <input type="hidden" name="category" value={filters.category} />
        ) : null}
        {filters.region ? <input type="hidden" name="region" value={filters.region} /> : null}
        <input
          type="search"
          name="search"
          defaultValue={filters.search ?? ""}
          maxLength={100}
          placeholder="Search produce or region"
          aria-label="Search produce or region"
          className="w-full rounded-full border border-bark-200 bg-white px-4 py-2"
        />
        <button
          type="submit"
          className="rounded-full bg-leaf-700 px-5 py-2 text-sm font-medium text-white hover:bg-leaf-800"
        >
          Search
        </button>
      </form>

      <nav aria-label="Categories" className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-bark-600">Category</span>
        <Chip href={hrefWith(filters, { category: undefined })} active={!filters.category}>
          All
        </Chip>
        {categories.map((category) => (
          <Chip
            key={category.id}
            href={hrefWith(filters, { category: category.slug })}
            active={category.slug === filters.category}
          >
            {category.name}
          </Chip>
        ))}
      </nav>

      {regions.length > 0 ? (
        <nav aria-label="Sourcing regions" className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-bark-600">Region</span>
          <Chip href={hrefWith(filters, { region: undefined })} active={!filters.region}>
            All
          </Chip>
          {regions.map((region) => (
            <Chip
              key={region}
              href={hrefWith(filters, { region })}
              active={region === filters.region}
            >
              {region}
            </Chip>
          ))}
        </nav>
      ) : null}

      {products.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-bark-200 bg-white p-10 text-center">
          <p className="text-bark-600">Nothing matches those filters yet.</p>
          {isFiltered ? (
            <Link href="/products" className="mt-3 inline-block text-sm text-leaf-700 underline">
              Clear all filters
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
