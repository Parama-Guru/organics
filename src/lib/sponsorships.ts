import "server-only";

import { prisma } from "./prisma";

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
    where: { status: "ACTIVE", startsAt: { lte: now }, endsAt: { gt: now } },
    select: { farmerId: true, storeId: true, priority: true },
    orderBy: [{ priority: "desc" }, { startsAt: "asc" }],
  });

  const farmer = new Map<string, number>();
  const store = new Map<string, number>();
  for (const placement of placements) {
    if (placement.farmerId) {
      farmer.set(
        placement.farmerId,
        Math.max(farmer.get(placement.farmerId) ?? -1, placement.priority),
      );
    }
    if (placement.storeId) {
      store.set(
        placement.storeId,
        Math.max(store.get(placement.storeId) ?? -1, placement.priority),
      );
    }
  }

  return { farmer, store };
}

export function sponsoredFirst<T extends { id: string }>(
  rows: T[],
  priorities: Map<string, number>,
): Array<T & { sponsored: boolean }> {
  return rows
    .map((row, position) => ({
      row,
      sponsored: priorities.has(row.id),
      priority: priorities.get(row.id) ?? -1,
      position,
    }))
    .sort((a, b) => b.priority - a.priority || a.position - b.position)
    .map((entry) => ({ ...entry.row, sponsored: entry.sponsored }));
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
        store: { status: "VERIFIED" },
      },
    })
    .then((count) => count > 0);
}
