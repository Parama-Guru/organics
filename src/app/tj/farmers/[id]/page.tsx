import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DecisionButtons } from "@/app/tj/decision-buttons";
import { DeleteFarmButton, ProductControls } from "@/app/tj/manage-buttons";
import { PortalAccess } from "@/app/tj/portal-access";
import {
  FarmerEvidenceForm,
  SellerFlagButton,
} from "@/app/tj/seller-review-controls";
import { Badge } from "@/components/ui/badge";
import { isSignedIn } from "@/lib/admin-auth";
import { farmerPortalEnabled, inviteIsOutstanding } from "@/lib/farmer-auth";
import { indiaDateKey } from "@/lib/india-date";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Status = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

const ACTIONS: Record<
  Status,
  { status: Status; label: string; variant?: "primary" | "secondary" | "dark" | "danger" }[]
> = {
  PENDING: [
    { status: "VERIFIED", label: "Approve", variant: "primary" },
    { status: "REJECTED", label: "Reject", variant: "danger" },
  ],
  VERIFIED: [{ status: "SUSPENDED", label: "Suspend", variant: "danger" }],
  REJECTED: [{ status: "PENDING", label: "Reopen for review" }],
  SUSPENDED: [
    { status: "VERIFIED", label: "Restore", variant: "primary" },
    { status: "PENDING", label: "Move back to review" },
  ],
};

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
      about: true,
      aboutTa: true,
      govtIdLast4: true,
      certifier: true,
      certificateNo: true,
      certificateUrl: true,
      certifiedUntil: true,
      verifiedAt: true,
      reviewNote: true,
      flaggedAt: true,
      flagReason: true,
      createdAt: true,
      updatedAt: true,
      portalEnabledAt: true,
      passwordHash: true,
      lastSignInAt: true,
      region: { select: { name: true } },
      reviewEvents: { orderBy: { createdAt: "desc" }, take: 30 },
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
  const certificateCurrent = Boolean(
    farmer.certifiedUntil && farmer.certifiedUntil >= new Date(),
  );

  return (
    <>
      <Link href="/tj" className="inline-flex min-h-11 items-center text-sm text-bark-600">
        ← Applications
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="section-kicker">Farmer evidence record</p>
          <h1 className="mt-4 font-display text-5xl font-medium leading-none break-words text-bark-900 sm:text-6xl">{farmer.farmName}</h1>
          <p className="mt-1 text-sm text-bark-600">
            {farmer.contactName} · {farmer.region.name} · {farmer.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {farmer.flaggedAt ? <Badge tone="marigold">REVIEW FLAG</Badge> : null}
          <Badge tone={farmer.status === "VERIFIED" ? "leaf" : farmer.status === "PENDING" ? "marigold" : "neutral"}>
            {farmer.status}
          </Badge>
        </div>
      </div>

      {farmer.flagReason ? (
        <div className="mt-5 rounded-2xl border border-marigold-300 bg-marigold-50 p-4">
          <p className="font-medium text-bark-900">Needs review</p>
          <p className="mt-1 text-sm text-bark-700">{farmer.flagReason}</p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <DecisionButtons farmerId={farmer.id} actions={ACTIONS[farmer.status]} />
        <SellerFlagButton
          kind="farmer"
          sellerId={farmer.id}
          flagged={farmer.flaggedAt !== null}
        />
        {farmer.status === "VERIFIED" && certificateCurrent ? (
          <Link href={`/ta/farmers/${farmer.slug}`} className="inline-flex min-h-11 items-center text-sm font-medium text-brand underline underline-offset-4">
            View public page
          </Link>
        ) : null}
      </div>

      {farmer.status === "VERIFIED" && !certificateCurrent ? (
        <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Public hold: this farm has VERIFIED status but no current certificate. Its farm page
          and listings remain hidden until the evidence below has a future expiry.
        </p>
      ) : null}

      <section className="editorial-panel mt-8 rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="font-display text-3xl text-bark-900">Application and verification</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div><dt className="text-bark-600">Phone</dt><dd><a href={`tel:${farmer.phone.replace(/[^+0-9]/g, "")}`} className="underline">{farmer.phone}</a></dd></div>
          <div><dt className="text-bark-600">District</dt><dd>{farmer.region.name}</dd></div>
          <div><dt className="text-bark-600">Applied</dt><dd>{farmer.createdAt.toISOString()}</dd></div>
          <div><dt className="text-bark-600">Last changed</dt><dd>{farmer.updatedAt.toISOString()}</dd></div>
          <div><dt className="text-bark-600">Last approved</dt><dd>{farmer.verifiedAt?.toISOString() ?? "—"}</dd></div>
          <div><dt className="text-bark-600">Listings</dt><dd>{farmer.products.length}</dd></div>
        </dl>
        {farmer.about ? <p className="mt-4 leading-relaxed text-bark-700">{farmer.about}</p> : null}
        {farmer.aboutTa ? <p className="mt-3 leading-relaxed text-bark-700" lang="ta">{farmer.aboutTa}</p> : null}

        <FarmerEvidenceForm
          farmerId={farmer.id}
          initial={{
            govtIdLast4: farmer.govtIdLast4 ?? "",
            certifier: farmer.certifier ?? "",
            certificateNo: farmer.certificateNo ?? "",
            certifiedUntil: farmer.certifiedUntil ? indiaDateKey(farmer.certifiedUntil) : "",
            certificateUrl: farmer.certificateUrl ?? "",
            note: farmer.reviewNote ?? "",
          }}
        />
      </section>

      {farmerPortalEnabled() ? (
        <PortalAccess
          sellerId={farmer.id}
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

      <section className="editorial-panel mt-8 rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="font-display text-3xl text-bark-900">Review history</h2>
        {farmer.reviewEvents.length === 0 ? (
          <p className="mt-3 text-sm text-bark-600">No recorded review event yet.</p>
        ) : (
          <ol className="mt-4 grid gap-2">
            {farmer.reviewEvents.map((event) => (
              <li key={event.id} className="rounded-xl bg-bark-50 px-4 py-3 text-sm">
                <p className="font-medium text-bark-900">
                  {event.action.replaceAll("_", " ")}
                  {event.fromStatus || event.toStatus
                    ? ` · ${event.fromStatus ?? "—"} → ${event.toStatus ?? "—"}`
                    : ""}
                </p>
                <p className="mt-1 text-bark-600">{event.createdAt.toISOString()}</p>
                {event.note ? <p className="mt-1 text-bark-700">{event.note}</p> : null}
              </li>
            ))}
          </ol>
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
