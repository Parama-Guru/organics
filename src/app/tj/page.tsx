import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DecisionButtons } from "@/app/tj/decision-buttons";
import { PortalAccess } from "@/app/tj/portal-access";
import { SellerFlagButton } from "@/app/tj/seller-review-controls";
import { Badge } from "@/components/ui/badge";
import { isSignedIn } from "@/lib/admin-auth";
import { farmerPortalEnabled, inviteStates } from "@/lib/farmer-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const TONE = {
  PENDING: "marigold",
  VERIFIED: "leaf",
  REJECTED: "neutral",
  SUSPENDED: "neutral",
} as const;

function FarmerRow({
  farmer,
  actions,
  portal,
}: {
  farmer: {
    id: string;
    slug: string;
    farmName: string;
    contactName: string;
    email: string;
    phone: string;
    region: { name: string };
    about: string | null;
    govtIdLast4: string | null;
    certifier: string | null;
    certificateNo: string | null;
    certifiedUntil: Date | null;
    certificateUrl: string | null;
    status: keyof typeof TONE;
    flaggedAt: Date | null;
    flagReason: string | null;
    createdAt: Date;
    portalEnabledAt: Date | null;
    passwordHash: string | null;
    lastSignInAt: Date | null;
    inviteOutstanding: boolean;
    _count: { products: number };
  };
  actions: { status: "VERIFIED" | "REJECTED" | "SUSPENDED" | "PENDING"; label: string; variant?: "primary" | "secondary" | "dark" | "danger" }[];
  portal: boolean;
}) {
  return (
    <li className="editorial-panel rounded-[1.5rem] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-bark-900">
            <Link href={`/tj/farmers/${farmer.id}`} className="hover:underline">
              {farmer.farmName}
            </Link>
          </h3>
          <p className="text-sm text-bark-600">
            {farmer.contactName} · {farmer.region.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {farmer.flaggedAt ? <Badge tone="marigold">REVIEW FLAG</Badge> : null}
          <Badge tone={TONE[farmer.status]}>{farmer.status}</Badge>
        </div>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-bark-600">Phone</dt>
          <dd className="font-medium">
            <a href={`tel:${farmer.phone.replace(/\s/g, "")}`} className="hover:underline">
              {farmer.phone}
            </a>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-bark-600">Email</dt>
          <dd className="min-w-0 truncate font-medium">{farmer.email}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-bark-600">Aadhaar last 4</dt>
          <dd className="font-mono font-medium">{farmer.govtIdLast4 ?? "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-bark-600">Applied</dt>
          <dd className="font-medium">{farmer.createdAt.toISOString().slice(0, 10)}</dd>
        </div>
        {/* "Certified organic" is a regulated claim, so an approver is shown the
            scheme and the certificate number rather than asked to take it on
            trust from a name and four Aadhaar digits. */}
        <div className="flex gap-2">
          <dt className="text-bark-600">Certified by</dt>
          <dd className="min-w-0 font-medium break-words">{farmer.certifier || "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-bark-600">Certificate no.</dt>
          <dd className="min-w-0 font-mono font-medium break-all">
            {farmer.certificateNo || "—"}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-bark-600">Valid until</dt>
          <dd className="font-medium">
            {farmer.certifiedUntil ? farmer.certifiedUntil.toISOString().slice(0, 10) : "—"}
          </dd>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <dt className="text-bark-600">Certificate</dt>
          <dd className="min-w-0 truncate font-medium">
            {farmer.certificateUrl ? (
              // Untrusted, applicant-supplied URL: never let it reach window.opener.
              <a
                href={farmer.certificateUrl}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="hover:underline"
              >
                {farmer.certificateUrl}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>

      {farmer.about ? <p className="mt-3 text-sm text-bark-600">{farmer.about}</p> : null}

      {farmer.flagReason ? (
        <p className="mt-3 rounded-xl border border-marigold-200 bg-marigold-50 p-3 text-sm text-bark-900">
          Review flag: {farmer.flagReason}
        </p>
      ) : null}

      {farmer.status === "VERIFIED" ? (
        <p className="mt-3 text-sm text-bark-600">
          <Link href={`/tj/farmers/${farmer.id}`} className="font-medium hover:underline">
            {farmer._count.products} listing{farmer._count.products === 1 ? "" : "s"}
          </Link>{" "}
          ·{" "}
          <Link href={`/ta/farmers/${farmer.slug}`} className="font-medium hover:underline">
            View public page
          </Link>
        </p>
      ) : null}

      <DecisionButtons farmerId={farmer.id} actions={actions} />

      <div className="mt-3">
        <SellerFlagButton
          kind="farmer"
          sellerId={farmer.id}
          flagged={farmer.flaggedAt !== null}
        />
      </div>

      {portal ? (
        <PortalAccess
          sellerId={farmer.id}
          access={{
            invitedAt: farmer.portalEnabledAt,
            // The hash itself never reaches the client; only whether one exists.
            hasPassword: farmer.passwordHash !== null,
            inviteOutstanding: farmer.inviteOutstanding,
            lastSignInAt: farmer.lastSignInAt,
          }}
          disabled={farmer.status !== "VERIFIED"}
        />
      ) : null}
    </li>
  );
}

export default async function AdminHome({ searchParams }: PageProps<"/tj">) {
  if (!(await isSignedIn())) redirect("/tj/login");

  const params = await searchParams;
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const flaggedOnly = (Array.isArray(params.flagged) ? params.flagged[0] : params.flagged) === "1";

  const select = {
    id: true,
    slug: true,
    farmName: true,
    contactName: true,
    email: true,
    phone: true,
    region: { select: { name: true } },
    about: true,
    govtIdLast4: true,
    certifier: true,
    certificateNo: true,
    certifiedUntil: true,
    certificateUrl: true,
    status: true,
    flaggedAt: true,
    flagReason: true,
    createdAt: true,
    portalEnabledAt: true,
    passwordHash: true,
    lastSignInAt: true,
    _count: { select: { products: true } },
  } as const;

  const portal = farmerPortalEnabled();

  // Search covers the columns an admin actually has to hand when a farm rings
  // up: the farm name, the person, the email and the phone.
  const matching: Prisma.FarmerWhereInput = {
    ...(flaggedOnly ? { flaggedAt: { not: null } } : {}),
    ...(query
      ? {
        OR: [
          { farmName: { contains: query, mode: "insensitive" } },
          { contactName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query } },
        ],
      }
      : {}),
  };

  const [pendingFarms, verified, closed, verifiedTotal, closedTotal] = await Promise.all([
    prisma.farmer.findMany({
      // The review queue is the job, so it is never truncated.
      where: { status: "PENDING", ...matching },
      orderBy: { createdAt: "asc" },
      select,
    }),
    prisma.farmer.findMany({
      where: { status: "VERIFIED", ...matching },
      orderBy: { farmName: "asc" },
      take: PAGE_SIZE,
      select,
    }),
    prisma.farmer.findMany({
      where: { status: { in: ["REJECTED", "SUSPENDED"] }, ...matching },
      orderBy: { updatedAt: "desc" },
      take: PAGE_SIZE,
      select,
    }),
    prisma.farmer.count({ where: { status: "VERIFIED", ...matching } }),
    prisma.farmer.count({
      where: { status: { in: ["REJECTED", "SUSPENDED"] }, ...matching },
    }),
  ]);

  // One round trip for the invite state of everything on the page, rather than
  // one per row.
  const outstanding = portal
    ? await inviteStates([...pendingFarms, ...verified, ...closed].map((farm) => farm.id))
    : new Set<string>();

  const withInvite = <T extends { id: string }>(farm: T) => ({
    ...farm,
    inviteOutstanding: outstanding.has(farm.id),
  });

  const pending = pendingFarms.map(withInvite);
  const live = verified.map(withInvite);
  const shut = closed.map(withInvite);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-kicker">Seller verification</p>
          <h1 className="mt-5 font-display text-5xl font-medium leading-none text-bark-900 sm:text-6xl">Farm reviews</h1>
          <p className="mt-4 max-w-2xl text-base text-bark-600">
            Nothing a farm submits is public until it is approved here.
          </p>
        </div>
        <Link
          href="/tj/farmers/new"
          className="inline-flex min-h-11 items-center text-sm font-medium text-bark-900 underline-offset-4 hover:underline"
        >
          Add a farm directly
        </Link>
      </div>

      {/* A plain GET form: the result is a URL an admin can bookmark or send to
          a colleague, and it works with JavaScript off. */}
      <form method="get" action="/tj" className="mt-5 flex flex-wrap gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search farms</span>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Farm, person, email or phone"
            className="min-h-11 w-full rounded-xl border border-bark-200 bg-paper px-3.5 focus:border-marigold-400 focus:outline-none focus:ring-4 focus:ring-marigold-400/25"
          />
        </label>
        {flaggedOnly ? <input type="hidden" name="flagged" value="1" /> : null}
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-inverse px-5 text-sm font-medium text-white"
        >
          Search
        </button>
        {query ? (
          <Link
            href={flaggedOnly ? "/tj?flagged=1" : "/tj"}
            className="inline-flex min-h-11 items-center rounded-xl border border-bark-200 bg-paper px-5 text-sm text-bark-600"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <Link
          href={query ? `/tj?q=${encodeURIComponent(query)}` : "/tj"}
          aria-current={!flaggedOnly ? "page" : undefined}
          className={`inline-flex min-h-10 items-center rounded-xl border px-4 ${
            !flaggedOnly ? "border-bark-900 bg-inverse text-white" : "border-bark-200 bg-paper text-bark-600"
          }`}
        >
          All farms
        </Link>
        <Link
          href={`/tj?flagged=1${query ? `&q=${encodeURIComponent(query)}` : ""}`}
          aria-current={flaggedOnly ? "page" : undefined}
          className={`inline-flex min-h-10 items-center rounded-xl border px-4 ${
            flaggedOnly ? "border-marigold-500 bg-marigold-50 text-bark-900" : "border-bark-200 bg-paper text-bark-600"
          }`}
        >
          Flagged for review
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-3xl text-bark-900">
          Waiting for review <span className="text-bark-600">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-bark-200 bg-paper p-8 text-center text-sm text-bark-600">
            {query ? "No waiting application matches that search." : "No applications waiting."}
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {pending.map((farmer) => (
              <FarmerRow
                key={farmer.id}
                farmer={farmer}
                portal={portal}
                actions={[
                  { status: "VERIFIED", label: "Approve", variant: "primary" },
                  { status: "REJECTED", label: "Reject", variant: "danger" },
                ]}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-3xl text-bark-900">
          Live on the site <span className="text-bark-600">({verifiedTotal})</span>
        </h2>
        {live.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-bark-200 bg-paper p-8 text-center text-sm text-bark-600">
            {query ? "No live farm matches that search." : "No verified farms yet."}
          </p>
        ) : (
          <>
            <ul className="mt-3 grid gap-3">
              {live.map((farmer) => (
                <FarmerRow
                  key={farmer.id}
                  farmer={farmer}
                  portal={portal}
                  actions={[{ status: "SUSPENDED", label: "Suspend", variant: "danger" }]}
                />
              ))}
            </ul>
            {verifiedTotal > live.length ? (
              <p className="mt-3 text-sm text-bark-600">
                Showing the first {live.length} of {verifiedTotal}. Use the search box to reach
                the rest.
              </p>
            ) : null}
          </>
        )}
      </section>

      {shut.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-3xl text-bark-900">
            Rejected and suspended <span className="text-bark-600">({closedTotal})</span>
          </h2>
          <ul className="mt-3 grid gap-3">
            {shut.map((farmer) => (
              <FarmerRow
                key={farmer.id}
                farmer={farmer}
                portal={portal}
                actions={[
                  { status: "VERIFIED", label: "Approve", variant: "primary" },
                  { status: "PENDING", label: "Move back to review" },
                ]}
              />
            ))}
          </ul>
          {closedTotal > shut.length ? (
            <p className="mt-3 text-sm text-bark-600">
              Showing the first {shut.length} of {closedTotal}.
            </p>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
