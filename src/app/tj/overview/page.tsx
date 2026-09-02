import Link from "next/link";
import { redirect } from "next/navigation";

import { isSignedIn } from "@/lib/admin-auth";
import { farmerPortalEnabled } from "@/lib/farmer-auth";
import { prisma } from "@/lib/prisma";
import { storePortalEnabled } from "@/lib/store-auth";
import { publicStoreWhere } from "@/lib/stores";

export const dynamic = "force-dynamic";

// Read per request, which is the point of a dashboard — kept out of the
// component body so it is a plain server call rather than a render-time clock.
async function weekAgo(): Promise<Date> {
  return new Date(Date.now() - 7 * 86_400_000);
}

function Stat({
  label,
  value,
  href,
  note,
  alarming,
}: {
  label: string;
  value: number;
  href?: string;
  note?: string;
  alarming?: boolean;
}) {
  const body = (
    <>
      <p className="text-sm text-bark-600">{label}</p>
      <p
        className={`mt-1 font-display text-3xl ${
          alarming && value > 0 ? "text-red-700" : "text-bark-900"
        }`}
      >
        {value}
      </p>
      {note ? <p className="mt-1 text-sm text-bark-600">{note}</p> : null}
    </>
  );

  const className =
    `block rounded-[1.5rem] border bg-paper p-6 shadow-soft ${alarming && value > 0 ? "border-red-300" : "border-bark-200"}` +
    (href ? " transition-colors hover:border-bark-400" : "");

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default async function AdminOverview() {
  if (!(await isSignedIn())) redirect("/tj/login");

  const sevenDaysAgo = await weekAgo();
  const now = new Date();

  const [
    pendingFarms,
    flaggedFarms,
    liveFarms,
    farmEvidenceHolds,
    suspendedFarms,
    liveListings,
    hiddenListings,
    strandedListings,
    emptyListings,
    farmsWithLogin,
    farmsWithoutLogin,
    buyers,
    newBuyers,
    savedProducts,
    pendingStores,
    flaggedStores,
    liveStores,
    storeEvidenceHolds,
    closedStores,
    storesWithLogin,
    storesWithoutLogin,
    unansweredMessages,
    newMessages,
    unresolvedEnquiries,
    failedEnquiries,
    activePromotions,
    recentEdits,
  ] = await Promise.all([
    prisma.farmer.count({ where: { status: "PENDING" } }),
    prisma.farmer.count({ where: { flaggedAt: { not: null } } }),
    prisma.farmer.count({ where: { status: "VERIFIED", certifiedUntil: { gte: now } } }),
    prisma.farmer.count({
      where: {
        status: "VERIFIED",
        OR: [{ certifiedUntil: null }, { certifiedUntil: { lt: now } }],
      },
    }),
    prisma.farmer.count({ where: { status: { in: ["SUSPENDED", "REJECTED"] } } }),
    prisma.product.count({
      where: {
        isActive: true,
        farmer: { status: "VERIFIED", certifiedUntil: { gte: now } },
        stock: { gt: 0 },
      },
    }),
    prisma.product.count({ where: { isActive: false } }),
    // Switched on, but the farm behind them is not verified, so no shopper can
    // see them. The farm usually does not know.
    prisma.product.count({
      where: {
        isActive: true,
        OR: [
          { farmer: { status: { not: "VERIFIED" } } },
          { farmer: { certifiedUntil: null } },
          { farmer: { certifiedUntil: { lt: now } } },
        ],
      },
    }),
    // Live, visible, and publicly marked "not available now" because nothing is
    // left to sell. The farm rarely realises.
    prisma.product.count({
      where: {
        isActive: true,
        farmer: { status: "VERIFIED", certifiedUntil: { gte: now } },
        stock: 0,
      },
    }),
    prisma.farmer.count({ where: { status: "VERIFIED", passwordHash: { not: null } } }),
    prisma.farmer.count({ where: { status: "VERIFIED", passwordHash: null } }),
    prisma.customer.count(),
    prisma.customer.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.savedProduct.count(),
    prisma.organicStore.count({ where: { status: "PENDING" } }),
    prisma.organicStore.count({ where: { flaggedAt: { not: null } } }),
    prisma.organicStore.count({ where: publicStoreWhere(now) }),
    prisma.organicStore.count({
      where: { status: "VERIFIED", NOT: publicStoreWhere(now) },
    }),
    prisma.organicStore.count({ where: { status: { in: ["SUSPENDED", "REJECTED"] } } }),
    prisma.organicStore.count({ where: { status: "VERIFIED", passwordHash: { not: null } } }),
    prisma.organicStore.count({ where: { status: "VERIFIED", passwordHash: null } }),
    prisma.contactMessage.count({ where: { handledAt: null } }),
    prisma.contactMessage.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.privateEnquiry.count({ where: { handledAt: null } }),
    prisma.privateEnquiry.count({ where: { handledAt: null, deliveryStatus: "FAILED" } }),
    prisma.sponsoredPlacement.count({
      where: {
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gt: now },
        OR: [
          { farmer: { status: "VERIFIED", certifiedUntil: { gte: now } } },
          { store: publicStoreWhere(now) },
        ],
      },
    }),
    prisma.product.findMany({
      where: { updatedAt: { gte: sevenDaysAgo } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        nameTa: true,
        isActive: true,
        updatedAt: true,
        farmer: { select: { id: true, farmName: true } },
      },
    }),
  ]);

  return (
    <>
      <p className="section-kicker">Live operations</p>
      <h1 className="mt-5 font-display text-5xl font-medium leading-none text-bark-900 sm:text-7xl">Command centre</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-bark-600">
        Everything the site is showing right now, and anything that needs a decision.
      </p>

      <section className="mt-12 border-t border-bark-200 pt-7">
        <h2 className="font-display text-3xl text-bark-900">Farms</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Waiting for review" value={pendingFarms} href="/tj" alarming />
          <Stat label="Flagged for review" value={flaggedFarms} href="/tj?flagged=1" alarming />
          <Stat label="Live on the site" value={liveFarms} href="/tj" />
          <Stat
            label="Hidden by expired evidence"
            value={farmEvidenceHolds}
            href="/tj"
            note="Verified status, but not publicly eligible"
            alarming
          />
          <Stat label="Rejected or suspended" value={suspendedFarms} href="/tj" />
          {farmerPortalEnabled() ? (
            <Stat
              label="Farms that can sign in"
              value={farmsWithLogin}
              note={`${farmsWithoutLogin} verified without a login`}
            />
          ) : (
            <Stat label="Farmer portal" value={0} note="Not configured on this server" />
          )}
        </div>
      </section>

      <section className="mt-12 border-t border-bark-200 pt-7">
        <h2 className="font-display text-3xl text-bark-900">Listings</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Live" value={liveListings} href="/tj/listings?show=live" />
          <Stat label="Hidden by the farm" value={hiddenListings} href="/tj/listings?show=hidden" />
          <Stat
            label="Not visible to anyone"
            value={strandedListings}
            href="/tj/listings?show=unpublished"
            note="On, but the farm is not verified"
            alarming
          />
          <Stat
            label="Out of stock"
            value={emptyListings}
            href="/tj/listings?show=empty"
            note='Public page reads "not available now"'
            alarming
          />
          <Stat label="Saved by buyers" value={savedProducts} />
        </div>
      </section>

      <section className="mt-12 border-t border-bark-200 pt-7">
        <h2 className="font-display text-3xl text-bark-900">Organic stores</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Waiting for review"
            value={pendingStores}
            href="/tj/stores?status=PENDING"
            alarming
          />
          <Stat
            label="Flagged for review"
            value={flaggedStores}
            href="/tj/stores?flagged=1"
            alarming
          />
          <Stat label="Live on the site" value={liveStores} href="/tj/stores?status=VERIFIED" />
          <Stat
            label="Hidden by evidence"
            value={storeEvidenceHolds}
            href="/tj/stores?status=VERIFIED"
            note="Incomplete or expired verification"
            alarming
          />
          <Stat label="Rejected or suspended" value={closedStores} href="/tj/stores" />
          {storePortalEnabled() ? (
            <Stat
              label="Stores that can sign in"
              value={storesWithLogin}
              note={`${storesWithoutLogin} verified without a login`}
            />
          ) : (
            <Stat label="Store portal" value={0} note="Not configured on this server" />
          )}
        </div>
      </section>

      <section className="mt-12 border-t border-bark-200 pt-7">
        <h2 className="font-display text-3xl text-bark-900">Buyers</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Accounts" value={buyers} href="/tj/buyers" />
          <Stat label="Joined this week" value={newBuyers} href="/tj/buyers" />
        </div>
      </section>

      <section className="mt-12 border-t border-bark-200 pt-7">
        <h2 className="font-display text-3xl text-bark-900">Messages</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Unanswered"
            value={unansweredMessages}
            href="/tj/messages"
            note="Somebody is waiting on a reply"
            alarming
          />
          <Stat label="Arrived this week" value={newMessages} href="/tj/messages" />
        </div>
      </section>

      <section className="mt-12 border-t border-bark-200 pt-7">
        <h2 className="font-display text-3xl text-bark-900">Buyer enquiries and promotion</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Unresolved enquiries" value={unresolvedEnquiries} href="/tj/enquiries" alarming />
          <Stat
            label="Failed email delivery"
            value={failedEnquiries}
            href="/tj/enquiries?show=failed"
            alarming
          />
          <Stat label="Sponsored now" value={activePromotions} href="/tj/sponsored" />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-bark-900">Changed this week</h2>
        {recentEdits.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-bark-200 bg-paper p-8 text-center text-sm text-bark-600">
            No listing has been touched in the last seven days.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {recentEdits.map((product) => (
              <li
                key={product.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl border border-bark-200 bg-paper px-4 py-3 text-sm"
              >
                <span className="min-w-0 break-words text-bark-900">
                  {product.nameTa ?? product.name}
                  {product.isActive ? "" : " (hidden)"}
                </span>
                <span className="text-bark-600">
                  <Link
                    href={`/tj/farmers/${product.farmer.id}`}
                    className="font-medium hover:underline"
                  >
                    {product.farmer.farmName}
                  </Link>{" "}
                  · {product.updatedAt.toISOString().slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
