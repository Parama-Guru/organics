import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
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
      className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition-all duration-200 hover:-translate-y-0.5 ${
        active
          ? "bg-bark-900 text-bark-50 ring-bark-900 shadow-soft"
          : "bg-white/70 text-bark-600 ring-bark-200 backdrop-blur hover:text-bark-900 hover:ring-marigold-400"
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
      <h1 className="font-display text-3xl sm:text-4xl">
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
          className="w-full rounded-full border border-bark-200 bg-white/80 px-5 py-2.5 shadow-soft backdrop-blur transition-[border-color,box-shadow] placeholder:text-bark-600/55 focus:border-marigold-400 focus:outline-none focus:ring-4 focus:ring-marigold-400/25"
        />
        <Button type="submit" variant="dark">
          Search
        </Button>
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
        <div className="glass mt-10 animate-rise rounded-3xl p-12 text-center">
          <span aria-hidden className="text-5xl">
            {"\u{1F50D}"}
          </span>
          <p className="mt-4 font-display text-xl">Nothing matches those filters</p>
          {isFiltered ? (
            <Button as={Link} href="/products" variant="secondary" className="mt-5">
              Clear all filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
              className="animate-rise"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
