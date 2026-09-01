import "server-only";

import { prisma } from "./prisma";

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Farms are typed in by hand, so a district arrives as free text. Matching
 * case-insensitively on the name first is what stops "Erode" and "erode"
 * becoming two rows and splitting the filter.
 */
export async function regionIdForName(name: string): Promise<string> {
  const trimmed = name.trim();
  const existing = await prisma.region.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.region.create({
    data: { name: trimmed, slug: slugify(trimmed) },
    select: { id: true },
  });
  return created.id;
}

/** Null rather than a new row: a buyer's typo should not create a district. */
export async function regionIdForCustomer(name: string | undefined): Promise<string | null> {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  const match = await prisma.region.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
    select: { id: true },
  });
  return match?.id ?? null;
}
