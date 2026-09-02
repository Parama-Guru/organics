import "server-only";

import { prisma } from "./prisma";
import type { ActiveSponsorship } from "./sponsorship-ranking";
import { publicStoreWhere } from "./stores";

export { sponsoredFirst } from "./sponsorship-ranking";

export async function updateSponsoredPlacementStatus(
  id: string,
  status: "ACTIVE" | "PAUSED" | "ENDED",
): Promise<"UPDATED" | "EXPIRED" | "NOT_FOUND"> {
  const { count } = await prisma.sponsoredPlacement.updateMany({
    where: {
      id,
      ...(status !== "ENDED" ? { status: { not: "ENDED" } } : {}),
      ...(status === "ACTIVE" ? { endsAt: { gt: new Date() } } : {}),
    },
    // Status alone removes an ended placement from every public ranking query;
    // preserving the contracted window keeps the audit record truthful.
    data: { status },
  });
  if (count === 1) return "UPDATED";

  const exists = await prisma.sponsoredPlacement.count({ where: { id } });
  return exists ? "EXPIRED" : "NOT_FOUND";
}

export async function activeSponsoredIds() {
  const now = new Date();
  const placements = await prisma.sponsoredPlacement.findMany({
    where: {
      status: "ACTIVE",
      startsAt: { lte: now },
      endsAt: { gt: now },
      OR: [
        { farmer: { status: "VERIFIED", certifiedUntil: { gte: now } } },
        { store: publicStoreWhere(now) },
      ],
    },
    select: { id: true, farmerId: true, storeId: true, priority: true },
    orderBy: [{ priority: "desc" }, { startsAt: "asc" }],
  });

  const farmer = new Map<string, ActiveSponsorship>();
  const store = new Map<string, ActiveSponsorship>();
  for (const placement of placements) {
    if (
      placement.farmerId &&
      placement.priority > (farmer.get(placement.farmerId)?.priority ?? -1)
    ) {
      farmer.set(placement.farmerId, {
        placementId: placement.id,
        priority: placement.priority,
      });
    }
    if (
      placement.storeId &&
      placement.priority > (store.get(placement.storeId)?.priority ?? -1)
    ) {
      store.set(placement.storeId, {
        placementId: placement.id,
        priority: placement.priority,
      });
    }
  }

  return { farmer, store };
}

export function isFarmerSponsored(farmerId: string): Promise<boolean> {
  const now = new Date();
  return prisma.sponsoredPlacement
    .count({
      where: {
        farmerId,
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gt: now },
        farmer: { status: "VERIFIED", certifiedUntil: { gte: now } },
      },
    })
    .then((count) => count > 0);
}

export function isStoreSponsored(storeId: string): Promise<boolean> {
  const now = new Date();
  return prisma.sponsoredPlacement
    .count({
      where: {
        storeId,
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gt: now },
        store: publicStoreWhere(now),
      },
    })
    .then((count) => count > 0);
}
