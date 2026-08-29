import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getVerifiedFarmers } from "@/lib/farmers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Our farmers",
  description:
    "The verified organic farms behind the shop, listed with their region and what they grow.",
};

export default async function FarmersPage() {
  const farmers = await getVerifiedFarmers();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Badge tone="leaf">
        <span aria-hidden>&#10003;</span> Every farm verified
      </Badge>
      <h1 className="mt-4 font-display text-4xl sm:text-5xl">Our farmers</h1>
      <p className="mt-3 max-w-2xl text-bark-600">
        We check each farm&apos;s details before a single listing goes live. Call them directly, or
        book from any product page.
      </p>

      {farmers.length === 0 ? (
        <div className="glass mt-10 rounded-3xl p-12 text-center">
          <p className="font-display text-xl">No farms listed yet</p>
          <Button as={Link} href="/sell" className="mt-5">
            Apply to list your farm
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {farmers.map((farmer, index) => (
            <Link
              key={farmer.id}
              href={`/farmers/${farmer.slug}`}
              style={{ animationDelay: `${index * 60}ms` }}
              className="group animate-rise rounded-3xl border border-white/70 bg-white/70 p-6 shadow-soft backdrop-blur-md transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-marigold-400/70 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  aria-hidden
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf-100 text-2xl"
                >
                  {"\u{1F33E}"}
                </span>
                <Badge tone="leaf">{farmer.region}</Badge>
              </div>

              <h2 className="mt-4 font-display text-xl">{farmer.farmName}</h2>
              <p className="text-sm text-bark-600">{farmer.contactName}</p>
              {farmer.about ? (
                <p className="mt-3 line-clamp-3 text-sm text-bark-600">{farmer.about}</p>
              ) : null}

              <p className="mt-4 border-t border-bark-200/60 pt-3 text-sm font-medium">
                {farmer._count.products} listing{farmer._count.products === 1 ? "" : "s"}
                <span
                  aria-hidden
                  className="ml-2 inline-block text-marigold-500 transition-transform duration-300 group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </p>
            </Link>
          ))}
        </div>
      )}

      <section className="glass mt-14 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-8">
        <div>
          <h2 className="font-display text-2xl">Grow organic produce?</h2>
          <p className="mt-1 text-bark-600">Apply to list your farm here.</p>
        </div>
        <Button as={Link} href="/sell" size="lg">
          Sell with us
        </Button>
      </section>
    </div>
  );
}
