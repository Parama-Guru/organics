import { redirect } from "next/navigation";

import { PromotionForm, PromotionStatusButtons } from "@/app/tj/sponsored/forms";
import { Badge } from "@/components/ui/badge";
import { isSignedIn } from "@/lib/admin-auth";
import { indiaDateInputValue, indiaDateKey } from "@/lib/india-date";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SponsoredAdminPage() {
  if (!(await isSignedIn())) redirect("/tj/login");

  const now = new Date();
  const defaultStart = indiaDateInputValue(now);
  const defaultEnd = indiaDateInputValue(new Date(now.getTime() + 30 * 86_400_000));

  const [farmers, stores, placements] = await Promise.all([
    prisma.farmer.findMany({
      where: { status: "VERIFIED", certifiedUntil: { gte: now } },
      select: { id: true, farmName: true },
      orderBy: { farmName: "asc" },
    }),
    prisma.organicStore.findMany({
      where: { status: "VERIFIED" },
      select: { id: true, storeName: true },
      orderBy: { storeName: "asc" },
    }),
    prisma.sponsoredPlacement.findMany({
      include: {
        farmer: { select: { farmName: true, status: true } },
        store: { select: { storeName: true, status: true } },
      },
      orderBy: [{ status: "asc" }, { endsAt: "desc" }],
    }),
  ]);

  return (
    <>
      <h1 className="font-display text-2xl text-bark-900">Sponsored placement</h1>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-bark-600">
        First-party placement only. It moves a verified farmer or store above organic results;
        every public card is labelled Sponsored / விளம்பரம். It does not change verification.
      </p>

      <PromotionForm
        farmers={farmers.map((farmer) => ({ id: farmer.id, name: farmer.farmName }))}
        stores={stores.map((store) => ({ id: store.id, name: store.storeName }))}
        defaultStart={defaultStart}
        defaultEnd={defaultEnd}
      />

      {placements.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-bark-200 bg-white p-8 text-center text-sm text-bark-600">
          No promotion has been created.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {placements.map((placement) => {
            const target = placement.farmer?.farmName ?? placement.store?.storeName ?? "Deleted target";
            const targetStatus = placement.farmer?.status ?? placement.store?.status;
            const liveNow = placement.status === "ACTIVE" && placement.startsAt <= now && placement.endsAt > now;
            const displayStatus =
              placement.status === "ACTIVE" && placement.startsAt > now
                ? "SCHEDULED"
                : placement.status === "ACTIVE" && placement.endsAt <= now
                  ? "EXPIRED"
                  : placement.status;
            return (
              <li key={placement.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-bark-200 bg-white p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-bark-900">{target}</h2>
                    <Badge tone={liveNow ? "marigold" : "neutral"}>{displayStatus}</Badge>
                    {targetStatus !== "VERIFIED" ? <Badge tone="neutral">TARGET {targetStatus}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-bark-600">
                    {indiaDateKey(placement.startsAt)} → {indiaDateKey(placement.endsAt)} · priority {placement.priority}
                  </p>
                  {placement.internalNote ? <p className="mt-1 text-sm text-bark-600">{placement.internalNote}</p> : null}
                </div>
                <PromotionStatusButtons id={placement.id} status={placement.status} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
