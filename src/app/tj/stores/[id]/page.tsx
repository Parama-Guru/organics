import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PortalAccess } from "@/app/tj/portal-access";
import {
  SellerFlagButton,
  StoreEvidenceForm,
} from "@/app/tj/seller-review-controls";
import { DeleteStoreButton, StoreDecisionButtons } from "@/app/tj/store-buttons";
import { Badge } from "@/components/ui/badge";
import { isSignedIn } from "@/lib/admin-auth";
import { indiaDateKey } from "@/lib/india-date";
import { prisma } from "@/lib/prisma";
import {
  storeInviteIsOutstanding,
  storePortalEnabled,
} from "@/lib/store-auth";
import { storeEvidenceAllowsPublication } from "@/lib/stores";

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

export default async function AdminStorePage({ params }: PageProps<"/tj/stores/[id]">) {
  if (!(await isSignedIn())) redirect("/tj/login");

  const { id } = await params;
  const store = await prisma.organicStore.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      storeName: true,
      contactName: true,
      phone: true,
      email: true,
      addressLine: true,
      about: true,
      aboutTa: true,
      photoUrl: true,
      status: true,
      govtIdLast4: true,
      fssaiNumber: true,
      certifier: true,
      certificateNo: true,
      certificateUrl: true,
      certifiedUntil: true,
      verifiedAt: true,
      reviewNote: true,
      flaggedAt: true,
      flagReason: true,
      portalEnabledAt: true,
      passwordHash: true,
      lastSignInAt: true,
      createdAt: true,
      updatedAt: true,
      region: { select: { name: true, nameTa: true } },
      reviewEvents: { orderBy: { createdAt: "desc" }, take: 30 },
      _count: { select: { enquiries: true, sponsoredPlacements: true } },
    },
  });
  if (!store) notFound();
  const publicEligible = store.status === "VERIFIED" && storeEvidenceAllowsPublication(store);

  return (
    <>
      <Link href="/tj/stores" className="inline-flex min-h-11 items-center text-sm text-bark-600">
        ← Organic stores
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div>
              <p className="section-kicker">Store evidence record</p>
              <h1 className="mt-4 font-display text-5xl font-medium leading-none break-words text-bark-900 sm:text-6xl">{store.storeName}</h1>
            </div>
            {store.flaggedAt ? <Badge tone="marigold">REVIEW FLAG</Badge> : null}
            <Badge tone={store.status === "VERIFIED" ? "leaf" : store.status === "PENDING" ? "marigold" : "neutral"}>
              {store.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-bark-600">
            {store.contactName} · {store.region.name} · <span className="break-all">{store.email}</span>
          </p>
        </div>
        {store.photoUrl ? (
          <div className="relative h-24 w-40 overflow-hidden rounded-xl bg-leaf-50">
            <Image src={store.photoUrl} alt="" fill sizes="160px" className="object-cover" />
          </div>
        ) : null}
      </div>

      {store.flagReason ? (
        <div className="mt-5 rounded-2xl border border-marigold-300 bg-marigold-50 p-4">
          <p className="font-medium text-bark-900">Needs review</p>
          <p className="mt-1 text-sm text-bark-700">{store.flagReason}</p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <StoreDecisionButtons storeId={store.id} actions={ACTIONS[store.status]} />
        <SellerFlagButton kind="store" sellerId={store.id} flagged={store.flaggedAt !== null} />
        {publicEligible ? (
          <Link href={`/ta/stores/${store.slug}`} className="inline-flex min-h-11 items-center text-sm font-medium text-brand underline underline-offset-4">
            View public page
          </Link>
        ) : null}
      </div>

      {store.status === "VERIFIED" && !publicEligible ? (
        <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Public hold: this shop is marked VERIFIED but its FSSAI or recorded organic certificate
          evidence is incomplete or expired. The directory page stays hidden until corrected.
        </p>
      ) : null}

      <section className="editorial-panel mt-8 rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="font-display text-3xl text-bark-900">Application and public profile</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div><dt className="text-bark-600">Phone</dt><dd><a href={`tel:${store.phone.replace(/[^+0-9]/g, "")}`} className="underline">{store.phone}</a></dd></div>
          <div><dt className="text-bark-600">District</dt><dd>{store.region.name}{store.region.nameTa ? ` / ${store.region.nameTa}` : ""}</dd></div>
          <div className="sm:col-span-2"><dt className="text-bark-600">Address</dt><dd>{store.addressLine}</dd></div>
          <div><dt className="text-bark-600">Applied</dt><dd>{store.createdAt.toISOString()}</dd></div>
          <div><dt className="text-bark-600">Last changed</dt><dd>{store.updatedAt.toISOString()}</dd></div>
          <div><dt className="text-bark-600">Listed</dt><dd>{store.verifiedAt?.toISOString() ?? "—"}</dd></div>
          <div><dt className="text-bark-600">Buyer enquiries</dt><dd><Link href={`/tj/enquiries?q=${encodeURIComponent(store.email)}`} className="underline">{store._count.enquiries}</Link></dd></div>
          <div><dt className="text-bark-600">Promotions</dt><dd><Link href="/tj/sponsored" className="underline">{store._count.sponsoredPlacements}</Link></dd></div>
        </dl>
        {store.about ? <p className="mt-4 leading-relaxed text-bark-700">{store.about}</p> : null}
        {store.aboutTa ? <p className="mt-3 leading-relaxed text-bark-700" lang="ta">{store.aboutTa}</p> : null}
      </section>

      <section className="editorial-panel mt-8 rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="font-display text-3xl text-bark-900">Verification evidence</h2>
        <p className="mt-1 text-sm text-bark-600">
          A valid FSSAI licence is required. An organic certificate is optional for a reseller, but when recorded its scheme, number and future expiry must be complete.
        </p>
        <StoreEvidenceForm
          storeId={store.id}
          initial={{
            govtIdLast4: store.govtIdLast4 ?? "",
            fssaiNumber: store.fssaiNumber ?? "",
            certifier: store.certifier ?? "",
            certificateNo: store.certificateNo ?? "",
            certifiedUntil: store.certifiedUntil ? indiaDateKey(store.certifiedUntil) : "",
            certificateUrl: store.certificateUrl ?? "",
            note: store.reviewNote ?? "",
          }}
        />
      </section>

      {storePortalEnabled() ? (
        <PortalAccess
          sellerId={store.id}
          kind="store"
          access={{
            invitedAt: store.portalEnabledAt,
            hasPassword: store.passwordHash !== null,
            inviteOutstanding: await storeInviteIsOutstanding(store.id),
            lastSignInAt: store.lastSignInAt,
          }}
          disabled={store.status !== "VERIFIED"}
        />
      ) : null}

      <section className="editorial-panel mt-8 rounded-[1.75rem] p-6 sm:p-8">
        <h2 className="font-display text-3xl text-bark-900">Review history</h2>
        {store.reviewEvents.length === 0 ? (
          <p className="mt-3 text-sm text-bark-600">No recorded review event yet.</p>
        ) : (
          <ol className="mt-4 grid gap-2">
            {store.reviewEvents.map((event) => (
              <li key={event.id} className="rounded-xl bg-canvas-2 px-4 py-3 text-sm">
                <p className="font-medium text-bark-900">
                  {event.action.replaceAll("_", " ")}
                  {event.fromStatus || event.toStatus ? ` · ${event.fromStatus ?? "—"} → ${event.toStatus ?? "—"}` : ""}
                </p>
                <p className="mt-1 text-bark-600">{event.createdAt.toISOString()}</p>
                {event.note ? <p className="mt-1 text-bark-700">{event.note}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="font-display text-lg text-bark-900">Remove this store</h2>
        <p className="mt-1 text-sm text-bark-600">
          Suspending is reversible and hides the entry immediately. Delete only after a verified removal request.
        </p>
        <div className="mt-3">
          <DeleteStoreButton storeId={store.id} storeName={store.storeName} />
        </div>
      </section>
    </>
  );
}
