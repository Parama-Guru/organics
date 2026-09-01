import type { Prisma } from "@prisma/client";

import { prisma } from "./prisma";
import { decodeSlug } from "./products";

const storeCardSelect = {
  id: true,
  slug: true,
  storeName: true,
  contactName: true,
  phone: true,
  addressLine: true,
  region: true,
  about: true,
  aboutTa: true,
  photoUrl: true,
  verifiedAt: true,
  fssaiNumber: true,
  certifier: true,
  certificateNo: true,
  certificateUrl: true,
  certifiedUntil: true,
} satisfies Prisma.OrganicStoreSelect;

export type StoreCard = Prisma.OrganicStoreGetPayload<{ select: typeof storeCardSelect }>;

/**
 * Only VERIFIED shops are ever listed. PENDING, REJECTED and SUSPENDED stay
 * invisible to the public, exactly as farms do — the status check lives here so
 * no caller can forget it.
 */
export function getVerifiedStores(query = "") {
  const term = query.trim();

  return prisma.organicStore.findMany({
    where: {
      status: "VERIFIED",
      ...(term
        ? {
            OR: [
              { storeName: { contains: term, mode: "insensitive" } },
              { region: { name: { contains: term, mode: "insensitive" } } },
              { region: { nameTa: { contains: term, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: storeCardSelect,
    orderBy: { storeName: "asc" },
  });
}

export async function getStoreBySlug(rawSlug: string) {
  // Route params arrive percent-encoded; see decodeSlug.
  return prisma.organicStore.findFirst({
    where: { slug: decodeSlug(rawSlug), status: "VERIFIED" },
    select: storeCardSelect,
  });
}

/**
 * The registered totals shown at the foot of the home page.
 *
 * Counted the same way each is published: a farm or shop is counted once it is
 * VERIFIED, a buyer once the account is ACTIVE. Suspended entries are excluded,
 * so the figure never claims more than the site will actually show you.
 */
export async function getRegisteredCounts() {
  const [farmers, customers, stores] = await Promise.all([
    prisma.farmer.count({ where: { status: "VERIFIED" } }),
    prisma.customer.count({ where: { status: "ACTIVE" } }),
    prisma.organicStore.count({ where: { status: "VERIFIED" } }),
  ]);

  return { farmers, customers, stores };
}
