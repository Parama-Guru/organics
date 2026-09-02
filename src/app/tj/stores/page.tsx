import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminSearch, Pager } from "@/app/tj/table-controls";
import { DeleteStoreButton, StoreDecisionButtons } from "@/app/tj/store-buttons";
import { SellerFlagButton } from "@/app/tj/seller-review-controls";
import { Badge } from "@/components/ui/badge";
import { isSignedIn } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { storeEvidenceAllowsPublication } from "@/lib/stores";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const TONE: Record<string, "leaf" | "marigold" | "neutral"> = {
  VERIFIED: "leaf",
  PENDING: "marigold",
  REJECTED: "neutral",
  SUSPENDED: "neutral",
};

const STATUSES = ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"] as const;
type StoreStatus = (typeof STATUSES)[number];

// Which buttons a shop is offered depends on where it already is. Showing
// "Approve" on an approved shop is how a reviewer loses track of what they did.
const ACTIONS: Record<
  StoreStatus,
  { status: StoreStatus; label: string; variant?: "primary" | "secondary" | "dark" | "danger" }[]
> = {
  PENDING: [
    { status: "VERIFIED", label: "Approve", variant: "primary" },
    { status: "REJECTED", label: "Reject", variant: "danger" },
  ],
  VERIFIED: [{ status: "SUSPENDED", label: "Suspend", variant: "danger" }],
  REJECTED: [{ status: "PENDING", label: "Reopen" }],
  SUSPENDED: [{ status: "VERIFIED", label: "Restore", variant: "primary" }],
};

export default async function AdminStoresPage({ searchParams }: PageProps<"/tj/stores">) {
  if (!(await isSignedIn())) redirect("/tj/login");

  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const rawStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = STATUSES.find((value) => value === rawStatus);
  const flaggedOnly = (Array.isArray(params.flagged) ? params.flagged[0] : params.flagged) === "1";
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(1, Number(rawPage ?? 1) || 1);

  const where: Prisma.OrganicStoreWhereInput = {
    ...(status ? { status } : {}),
    ...(flaggedOnly ? { flaggedAt: { not: null } } : {}),
    ...(query
      ? {
          OR: [
            { storeName: { contains: query, mode: "insensitive" } },
            { contactName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
          ],
        }
      : {}),
  };

  const [stores, total, pending] = await Promise.all([
    prisma.organicStore.findMany({
      where,
      // Applications waiting on a decision first: this page is a queue before it
      // is a list.
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        storeName: true,
        contactName: true,
        email: true,
        phone: true,
        addressLine: true,
        status: true,
        fssaiNumber: true,
        govtIdLast4: true,
        certifier: true,
        certificateNo: true,
        certifiedUntil: true,
        certificateUrl: true,
        about: true,
        reviewNote: true,
        createdAt: true,
        verifiedAt: true,
        flaggedAt: true,
        flagReason: true,
        region: { select: { name: true } },
      },
    }),
    prisma.organicStore.count({ where }),
    prisma.organicStore.count({ where: { status: "PENDING" } }),
  ]);

  const filters = [
    { label: "All", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "Listed", value: "VERIFIED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Suspended", value: "SUSPENDED" },
  ];

  return (
    <>
      <p className="section-kicker">Seller verification</p>
      <h1 className="mt-5 font-display text-5xl font-medium leading-none text-bark-900 sm:text-6xl">Store reviews</h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-bark-600">
        Shops that resell certified produce. Checked the same way a farm is, but they stock rather
        than grow, so they carry an address and an FSSAI licence and own no listings. {total} shown,
        {" "}
        {pending} waiting on a decision.
      </p>

      <nav aria-label="Filter by status" className="mt-5 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = (status ?? "") === filter.value;
          const href = filter.value
            ? `/tj/stores?status=${filter.value}${query ? `&q=${encodeURIComponent(query)}` : ""}${flaggedOnly ? "&flagged=1" : ""}`
            : `/tj/stores${query || flaggedOnly ? `?${[query ? `q=${encodeURIComponent(query)}` : "", flaggedOnly ? "flagged=1" : ""].filter(Boolean).join("&")}` : ""}`;
          return (
            <a
              key={filter.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm ${
                active
                  ? "border-bark-900 bg-inverse text-white"
                  : "border-bark-200 bg-paper text-bark-600"
              }`}
            >
              {filter.label}
            </a>
          );
        })}
      </nav>

      <AdminSearch
        action="/tj/stores"
        query={query}
        placeholder="Shop, contact, email or phone"
        hidden={{
          ...(status ? { status } : {}),
          ...(flaggedOnly ? { flagged: "1" } : {}),
        }}
      />

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <Link
          href={`/tj/stores${status || query ? `?${[status ? `status=${status}` : "", query ? `q=${encodeURIComponent(query)}` : ""].filter(Boolean).join("&")}` : ""}`}
          aria-current={!flaggedOnly ? "page" : undefined}
          className={`inline-flex min-h-10 items-center rounded-xl border px-4 ${
            !flaggedOnly ? "border-bark-900 bg-inverse text-white" : "border-bark-200 bg-paper text-bark-600"
          }`}
        >
          All shops
        </Link>
        <Link
          href={`/tj/stores?${[status ? `status=${status}` : "", query ? `q=${encodeURIComponent(query)}` : "", "flagged=1"].filter(Boolean).join("&")}`}
          aria-current={flaggedOnly ? "page" : undefined}
          className={`inline-flex min-h-10 items-center rounded-xl border px-4 ${
            flaggedOnly ? "border-marigold-500 bg-marigold-50 text-bark-900" : "border-bark-200 bg-paper text-bark-600"
          }`}
        >
          Flagged for review
        </Link>
      </div>

      {stores.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-bark-200 bg-paper p-8 text-center text-sm text-bark-600">
          {query || status ? "No shop matches that." : "No shop has applied yet."}
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {stores.map((store) => (
            <li key={store.id} className="editorial-panel rounded-[1.5rem] p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium break-words text-bark-900">
                      <Link href={`/tj/stores/${store.id}`} className="hover:underline">
                        {store.storeName}
                      </Link>
                    </p>
                    {store.flaggedAt ? <Badge tone="marigold">REVIEW FLAG</Badge> : null}
                    <Badge tone={TONE[store.status] ?? "neutral"}>{store.status}</Badge>
                    {store.status === "VERIFIED" && !storeEvidenceAllowsPublication(store) ? (
                      <Badge tone="marigold">PUBLIC HOLD</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-bark-600">
                    {store.contactName} · {store.region.name} ·{" "}
                    <span className="break-all">{store.email}</span> · {store.phone}
                  </p>
                  <p className="mt-1 text-sm text-bark-600">{store.addressLine}</p>
                  <p className="mt-1 text-sm text-bark-600">
                    FSSAI {store.fssaiNumber ?? "—"} · Aadhaar ****{store.govtIdLast4 ?? "—"} ·
                    applied {store.createdAt.toISOString().slice(0, 10)}
                    {store.verifiedAt
                      ? ` · listed ${store.verifiedAt.toISOString().slice(0, 10)}`
                      : ""}
                  </p>
                  <p className="mt-1 text-sm text-bark-600">
                    {store.certifier ? (
                      <>
                        Certified: {store.certifier}
                        {store.certificateNo ? ` · ${store.certificateNo}` : ""}
                        {store.certifiedUntil
                          ? ` · valid until ${store.certifiedUntil.toISOString().slice(0, 10)}`
                          : ""}
                        {store.certificateUrl ? (
                          <>
                            {" · "}
                            <a
                              href={store.certificateUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline underline-offset-4"
                            >
                              certificate
                            </a>
                          </>
                        ) : null}
                      </>
                    ) : (
                      "No organic certificate supplied — a reseller need not hold one."
                    )}
                  </p>
                  {store.about ? (
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-bark-600">
                      {store.about}
                    </p>
                  ) : null}
                  {store.reviewNote ? (
                    <p className="mt-2 rounded-xl bg-canvas p-2.5 text-sm text-bark-600">
                      Note: {store.reviewNote}
                    </p>
                  ) : null}
                  {store.flagReason ? (
                    <p className="mt-2 rounded-xl border border-marigold-200 bg-marigold-50 p-2.5 text-sm text-bark-900">
                      Review flag: {store.flagReason}
                    </p>
                  ) : null}
                </div>
                <DeleteStoreButton storeId={store.id} storeName={store.storeName} />
              </div>

              <StoreDecisionButtons
                storeId={store.id}
                actions={ACTIONS[store.status]}
              />
              <div className="mt-3">
                <SellerFlagButton
                  kind="store"
                  sellerId={store.id}
                  flagged={store.flaggedAt !== null}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pager
        basePath="/tj/stores"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        extra={{
          ...(query ? { q: query } : {}),
          ...(status ? { status } : {}),
          ...(flaggedOnly ? { flagged: "1" } : {}),
        }}
      />
    </>
  );
}
