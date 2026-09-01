import "server-only";

import { prisma } from "./prisma";

/**
 * Marks are kept and the result is never empty.
 *
 * An `[^a-z0-9]+` filter reduced every Tamil district to "", and Region.slug is
 * unique — so the first Tamil district saved fine and the second one crashed
 * the request with a constraint violation, losing everything the farmer had
 * typed. NFKD would be just as bad: it splits Tamil vowel signs off as separate
 * marks and then drops them.
 */
function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFC")
      .replace(/[^\p{Letter}\p{Mark}\p{Number}]+/gu, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "district"
  );
}

async function uniqueRegionSlug(name: string): Promise<string> {
  const base = slugify(name);
  for (let attempt = 0; attempt < 40; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const clash = await prisma.region.findUnique({ where: { slug }, select: { id: true } });
    if (!clash) return slug;
  }
  return `${base}-${Date.now()}`;
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
    data: { name: trimmed, slug: await uniqueRegionSlug(trimmed) },
    select: { id: true },
  });
  return created.id;
}

/** Only rows that already exist, so a typo can never invent a district. */
export async function regionIdFromExisting(id: string | undefined): Promise<string | null> {
  if (!id) return null;
  const match = await prisma.region.findUnique({ where: { id }, select: { id: true } });
  return match?.id ?? null;
}

export function listRegions() {
  return prisma.region.findMany({
    select: { id: true, name: true, nameTa: true },
    orderBy: { name: "asc" },
  });
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
