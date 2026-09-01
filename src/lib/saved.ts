import "server-only";

import { prisma } from "./prisma";
import { productSummarySelect, publicProductWhere } from "./products";

/**
 * A saved item can outlive what it points at: a farm gets suspended, a listing
 * is withdrawn. Both reads filter through the same public visibility rule the
 * shop uses, so a saved list never becomes a way to see hidden listings.
 */
export async function getSavedProducts(customerId: string) {
  const rows = await prisma.savedProduct.findMany({
    where: { customerId, product: publicProductWhere },
    select: { product: { select: productSummarySelect } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return rows.map((row) => row.product);
}

export async function getSavedFarmers(customerId: string) {
  const rows = await prisma.savedFarmer.findMany({
    where: { customerId, farmer: { status: "VERIFIED" } },
    select: {
      farmer: {
        select: {
          id: true,
          slug: true,
          farmName: true,
          region: true,
          phone: true,
          photoUrl: true,
          _count: { select: { products: { where: publicProductWhere } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return rows.map((row) => row.farmer);
}

export async function savedProductIds(customerId: string, productIds: string[]) {
  if (productIds.length === 0) return new Set<string>();
  const rows = await prisma.savedProduct.findMany({
    where: { customerId, productId: { in: productIds } },
    select: { productId: true },
  });
  return new Set(rows.map((row) => row.productId));
}

export async function isProductSaved(customerId: string, productId: string): Promise<boolean> {
  const row = await prisma.savedProduct.findUnique({
    where: { customerId_productId: { customerId, productId } },
    select: { productId: true },
  });
  return row !== null;
}

export async function isFarmerSaved(customerId: string, farmerId: string): Promise<boolean> {
  const row = await prisma.savedFarmer.findUnique({
    where: { customerId_farmerId: { customerId, farmerId } },
    select: { farmerId: true },
  });
  return row !== null;
}
