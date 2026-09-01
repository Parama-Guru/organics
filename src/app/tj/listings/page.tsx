import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProductControls } from "@/app/tj/manage-buttons";
import { AdminSearch, Pager } from "@/app/tj/table-controls";
import { Badge } from "@/components/ui/badge";
import { isSignedIn } from "@/lib/admin-auth";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const TABS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "hidden", label: "Hidden" },
  { key: "unpublished", label: "Not visible" },
  { key: "empty", label: "Out of stock" },
] as const;

type Tab = (typeof TABS)[number]["key"];

function isTab(value: string | undefined): value is Tab {
  return TABS.some((tab) => tab.key === value);
}

function only(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminListingsPage({
  searchParams,
}: PageProps<"/tj/listings">) {
  if (!(await isSignedIn())) redirect("/tj/login");

  const params = await searchParams;
  const raw = only(params.show);
  const tab: Tab = isTab(raw) ? raw : "all";
  const query = only(params.q)?.trim() ?? "";
  const page = Math.max(1, Number(only(params.page) ?? 1) || 1);

  // "Not visible" is the one worth watching: the listing is switched on, but the
  // farm behind it is not verified, so nothing reaches a shopper. Without this
  // view a farm can sit there believing it is selling. "Out of stock" is the
  // same failure one step further in — live, visible, and marked unavailable.
  const byTab: Prisma.ProductWhereInput =
    tab === "live"
      ? { isActive: true, farmer: { status: "VERIFIED" }, stock: { gt: 0 } }
      : tab === "hidden"
        ? { isActive: false }
        : tab === "unpublished"
          ? { isActive: true, farmer: { status: { not: "VERIFIED" } } }
          : tab === "empty"
            ? { isActive: true, farmer: { status: "VERIFIED" }, stock: 0 }
            : {};

  const matching: Prisma.ProductWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { nameTa: { contains: query, mode: "insensitive" } },
          { farmer: { farmName: { contains: query, mode: "insensitive" } } },
        ],
      }
    : {};

  const where: Prisma.ProductWhereInput = { AND: [byTab, matching] };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        nameTa: true,
        slug: true,
        priceCents: true,
        unit: true,
        stock: true,
        isActive: true,
        updatedAt: true,
        category: { select: { name: true } },
        farmer: { select: { id: true, farmName: true, status: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const tabHref = (key: Tab) =>
    key === "all" ? "/tj/listings" : `/tj/listings?show=${key}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-bark-900">Listings</h1>
          <p className="mt-1 text-sm text-bark-600">
            Everything on the site, newest edit first. {total} match this view.
          </p>
        </div>
      </div>

      <nav aria-label="Filter listings" className="mt-5 flex flex-wrap gap-2">
        {TABS.map((option) => (
          <Link
            key={option.key}
            href={tabHref(option.key)}
            aria-current={option.key === tab ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm ${
              option.key === tab
                ? "border-bark-900 bg-bark-900 text-white"
                : "border-bark-200 bg-white text-bark-600 hover:text-bark-900"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      <AdminSearch
        action="/tj/listings"
        query={query}
        placeholder="Listing or farm name"
        hidden={tab === "all" ? {} : { show: tab }}
      />

      {products.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-bark-200 bg-white p-8 text-center text-sm text-bark-600">
          Nothing here.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-bark-200 bg-white p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium break-words text-bark-900">
                    {product.nameTa ?? product.name}
                  </p>
                  {!product.isActive ? <Badge tone="neutral">Hidden</Badge> : null}
                  {product.isActive && product.farmer.status !== "VERIFIED" ? (
                    <Badge tone="marigold">Farm {product.farmer.status.toLowerCase()}</Badge>
                  ) : null}
                  {product.isActive && product.stock === 0 ? (
                    <Badge tone="marigold">Out of stock</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-bark-600">
                  <Link
                    href={`/tj/farmers/${product.farmer.id}`}
                    className="font-medium hover:underline"
                  >
                    {product.farmer.farmName}
                  </Link>{" "}
                  · {formatMoney(product.priceCents)} / {product.unit} · {product.category.name} ·
                  stock {product.stock}
                </p>
                <p className="mt-1 text-sm text-bark-600">
                  Edited {product.updatedAt.toISOString().slice(0, 10)}
                  {product.isActive && product.farmer.status === "VERIFIED" ? (
                    <>
                      {" · "}
                      <Link
                        href={`/ta/products/${product.slug}`}
                        className="font-medium hover:underline"
                      >
                        View
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
              <ProductControls
                productId={product.id}
                name={product.nameTa ?? product.name}
                isActive={product.isActive}
              />
            </li>
          ))}
        </ul>
      )}

      <Pager
        basePath="/tj/listings"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        extra={{ ...(tab === "all" ? {} : { show: tab }), ...(query ? { q: query } : {}) }}
      />
    </>
  );
}
