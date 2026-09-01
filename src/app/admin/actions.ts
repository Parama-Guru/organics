"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isSignedIn } from "@/lib/admin-auth";
import { farmerApplicationSchema } from "@/lib/farmer-application-schema";
import { prisma } from "@/lib/prisma";
import { regionIdForName } from "@/lib/regions";

const decisionSchema = z.object({
  farmerId: z.string().min(1).max(60),
  note: z.string().max(500).optional(),
});

function slugify(farmName: string): string {
  const base = farmName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "farm"}-${randomBytes(3).toString("hex")}`;
}

export type ActionResult = { ok: true } | { ok: false; message: string };

const NOT_SIGNED_IN: ActionResult = {
  ok: false,
  message: "Your session has expired. Reload the page and sign in again.",
};

export async function decideFarmer(
  status: "VERIFIED" | "REJECTED" | "SUSPENDED" | "PENDING",
  formData: FormData,
): Promise<ActionResult> {
  // Server Actions are reachable by anyone who knows the action id, so the
  // session is re-checked here rather than trusted from the page that rendered.
  if (!(await isSignedIn())) return NOT_SIGNED_IN;

  const parsed = decisionSchema.safeParse({
    farmerId: formData.get("farmerId"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { ok: false, message: "That request was malformed." };

  await prisma.farmer.update({
    where: { id: parsed.data.farmerId },
    data: {
      status,
      // Clearing verifiedAt on the way out matters: the public queries gate on
      // status, but the "verified" badge reads verifiedAt.
      verifiedAt: status === "VERIFIED" ? new Date() : null,
      // Only written when a note was actually supplied, so a decision without
      // one does not wipe the note left by a previous reviewer.
      ...(parsed.data.note ? { reviewNote: parsed.data.note } : {}),
    },
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function createFarmer(formData: FormData): Promise<ActionResult> {
  if (!(await isSignedIn())) return NOT_SIGNED_IN;

  const parsed = farmerApplicationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fields = Object.keys(z.flattenError(parsed.error).fieldErrors).join(", ");
    return { ok: false, message: `Check these fields: ${fields}.` };
  }

  const input = parsed.data;
  const clash = await prisma.farmer.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (clash) return { ok: false, message: "A farm with that email already exists." };

  await prisma.farmer.create({
    data: {
      slug: slugify(input.farmName),
      farmName: input.farmName,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      regionId: await regionIdForName(input.region),
      about: input.about,
      govtIdLast4: input.govtIdLast4,
      certificateUrl: input.certificateUrl || null,
      // Added by an admin who has already done the checking, so it goes live.
      status: "VERIFIED",
      verifiedAt: new Date(),
      reviewNote: "Added directly by an admin.",
    },
  });

  revalidatePath("/admin");
  return { ok: true };
}
