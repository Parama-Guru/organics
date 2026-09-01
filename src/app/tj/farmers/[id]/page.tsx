import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DeleteFarmButton, ProductControls } from "@/app/tj/manage-buttons";
import { PortalAccess } from "@/app/tj/portal-access";
import { Badge } from "@/components/ui/badge";
import { isSignedIn } from "@/lib/admin-auth";
import { farmerPortalEnabled, inviteIsOutstanding } from "@/lib/farmer-auth";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminFarmPage({ params }: PageProps<"/tj/farmers/[id]">) {
  if (!(await isSignedIn())) redirect("/tj/login");

  const { id } = await params;
  const farmer = await prisma.farmer.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      farmName: true,
      contactName: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      portalEnabledAt: true,
      passwordHash: true,
      lastSignInAt: true,
      region: { select: { name: true } },
      products: {
        orderBy: { updatedAt: "desc" },
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
        },
      },
    },
  });

  if (!farmer) notFound();

  const live = farmer.products.filter((product) => product.isActive).length;

  return (
    <>
      <Link href="/tj" className="inline-flex min-h-11 items-center text-sm text-bark-600">
        ← Applications
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl break-words text-bark-900">{farmer.farmName}</h1>
          <p className="mt-1 text-sm text-bark-600">
            {farmer.contactName} · {farmer.region.name} · {farmer.email}
          </p>
        </div>
        <Badge tone={farmer.status === "VERIFIED" ? "leaf" : "neutral"}>{farmer.status}</Badge>
      </div>

      {farmerPortalEnabled() ? (
        <PortalAccess
          farmerId={farmer.id}
          access={{
            invitedAt: farmer.portalEnabledAt,
            hasPassword: farmer.passwordHash !== null,
            inviteOutstanding: await inviteIsOutstanding(farmer.id),
            lastSignInAt: farmer.lastSignInAt,
          }}
          disabled={farmer.status !== "VERIFIED"}
        />
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-lg text-bark-900">
          Listings <span className="text-bark-600">({live} live of {farmer.products.length})</span>
        </h2>
        <p className="mt-1 text-sm text-bark-600">
          The farm edits these itself in its portal. Anything hidden or deleted here goes
          straight off the public site.
        </p>

        {farmer.products.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-bark-200 bg-white p-8 text-center text-sm text-bark-600">
            This farm has not listed anything yet.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {farmer.products.map((product) => (
              <li
                key={product.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-bark-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium break-words text-bark-900">
                    {product.nameTa ?? product.name}
                  </p>
                  <p className="mt-1 text-sm text-bark-600">
                    {formatMoney(product.priceCents)} / {product.unit} · {product.category.name} ·
                    stock {product.stock}
                  </p>
                  <p className="mt-1 text-sm text-bark-600">
                    {product.isActive ? (
                      <Link
                        href={`/ta/products/${product.slug}`}
                        className="font-medium hover:underline"
                      >
                        Live on the site
                      </Link>
                    ) : (
                      "Hidden"
                    )}{" "}
                    · edited {product.updatedAt.toISOString().slice(0, 10)}
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
      </section>

      <section className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="font-display text-lg text-bark-900">Remove this farm</h2>
        <p className="mt-1 text-sm text-bark-600">
          Deletes the farm and every listing it published. Suspending instead keeps the record
          and hides it — prefer that unless the farm asked to be removed.
        </p>
        <div className="mt-3">
          <DeleteFarmButton
            farmerId={farmer.id}
            farmName={farmer.farmName}
            productCount={farmer.products.length}
          />
        </div>
      </section>
    </>
  );
}
