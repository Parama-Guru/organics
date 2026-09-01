"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isSignedIn } from "@/lib/admin-auth";
import { farmerApplicationSchema } from "@/lib/farmer-application-schema";
import { FARMER_PORTAL, cancelFarmerInvite, farmerPortalEnabled, issueFarmerInvite } from "@/lib/farmer-auth";
import { prisma } from "@/lib/prisma";
import { regionIdForName } from "@/lib/regions";
import { loadConfig } from "@conf/config";

const decisionSchema = z.object({
  farmerId: z.string().min(1).max(60),
  note: z.string().max(500).optional(),
});

function slugify(farmName: string): string {
  // Marks are kept: an a-z0-9 filter turns a Tamil farm name into nothing and
  // every such farm ends up at "farm-<hex>".
  const base = farmName
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{Letter}\p{Mark}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "farm"}-${randomBytes(3).toString("hex")}`;
}

export type ActionResult = { ok: true } | { ok: false; message: string };

const NOT_SIGNED_IN_MESSAGE =
  "Your session has expired. Reload the page and sign in again.";

const NOT_SIGNED_IN: ActionResult = { ok: false, message: NOT_SIGNED_IN_MESSAGE };

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

  revalidatePath("/tj");
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
      // Collected by the form and published on the farm's page, so they have to
      // be written here too — otherwise every directly added farm went live
      // reading "Certificate —" on the very claim the site is built on.
      certifier: input.certifier,
      certificateNo: input.certificateNo,
      certifiedUntil: input.certifiedUntil ? new Date(input.certifiedUntil) : null,
      certificateUrl: input.certificateUrl || null,
      // Added by an admin who has already done the checking, so it goes live.
      status: "VERIFIED",
      verifiedAt: new Date(),
      reviewNote: "Added directly by an admin.",
    },
  });

  revalidatePath("/tj");
  return { ok: true };
}

// ---------------------------------------------------------------- portal access

const idSchema = z.object({ id: z.string().min(1).max(60) });

export type LinkResult = { ok: true; url: string } | { ok: false; message: string };

/**
 * Hand a verified farm a way in.
 *
 * An admin never sets, sees or types a farm's password. This mints a one-time,
 * seven-day link; the farmer chooses their own password at the other end. The
 * link is shown to the admin to pass on, because outbound email is not
 * guaranteed to be configured and a farm waiting on an email that never arrives
 * is worse than a link read out over the phone.
 *
 * Only one link per farm is live at a time — issuing a new one retires the
 * previous one — and portalEnabledAt is stamped now so the admin screen can say
 * an invite is outstanding and offer to cancel it. It does not by itself grant
 * access: getFarmer() also requires a password, which only the farmer can set.
 */
export async function grantPortalAccess(formData: FormData): Promise<LinkResult> {
  if (!(await isSignedIn())) return { ok: false, message: NOT_SIGNED_IN_MESSAGE };
  if (!farmerPortalEnabled()) {
    return { ok: false, message: "The farmer portal is not configured on this server." };
  }

  const parsed = idSchema.safeParse({ id: formData.get("farmerId") });
  if (!parsed.success) return { ok: false, message: "That request was malformed." };

  // Only a farm that has actually passed review can be given a login.
  const farmer = await prisma.farmer.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, status: true },
  });
  if (!farmer) return { ok: false, message: "That farm no longer exists." };
  if (farmer.status !== "VERIFIED") {
    return { ok: false, message: "Approve the farm first, then invite it." };
  }

  const token = await issueFarmerInvite(farmer.id);
  await prisma.farmer.update({
    where: { id: farmer.id },
    data: { portalEnabledAt: new Date() },
  });

  const { app } = loadConfig();
  const base = app.site_url.replace(/\/$/, "");

  revalidatePath("/tj");
  revalidatePath(`/tj/farmers/${farmer.id}`);
  return {
    ok: true,
    url: `${base}${FARMER_PORTAL}/invite?farm=${farmer.id}&token=${token}`,
  };
}

/** Kill an outstanding link without touching an existing password. */
export async function cancelInvite(formData: FormData): Promise<ActionResult> {
  if (!(await isSignedIn())) return NOT_SIGNED_IN;

  const parsed = idSchema.safeParse({ id: formData.get("farmerId") });
  if (!parsed.success) return { ok: false, message: "That request was malformed." };

  await cancelFarmerInvite(parsed.data.id);

  // Only clear the "invited" stamp when there is no password behind it;
  // otherwise this would lock out a farm that is already signed up.
  await prisma.farmer.updateMany({
    where: { id: parsed.data.id, passwordHash: null },
    data: { portalEnabledAt: null },
  });

  revalidatePath("/tj");
  revalidatePath(`/tj/farmers/${parsed.data.id}`);
  return { ok: true };
}

/**
 * Take the login away without touching the listings.
 *
 * Clearing passwordHash is what actually locks the account out: getFarmer()
 * re-reads it on every request, so any live session stops working on the next
 * click rather than at expiry. Any outstanding link dies with it, or revoking
 * would leave a way back in.
 */
export async function revokePortalAccess(formData: FormData): Promise<ActionResult> {
  if (!(await isSignedIn())) return NOT_SIGNED_IN;

  const parsed = idSchema.safeParse({ id: formData.get("farmerId") });
  if (!parsed.success) return { ok: false, message: "That request was malformed." };

  await cancelFarmerInvite(parsed.data.id);
  await prisma.farmer.update({
    where: { id: parsed.data.id },
    data: { passwordHash: null, portalEnabledAt: null },
  });

  revalidatePath("/tj");
  revalidatePath(`/tj/farmers/${parsed.data.id}`);
  return { ok: true };
}

// -------------------------------------------------------------------- listings

export async function setProductActive(
  isActive: boolean,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isSignedIn())) return NOT_SIGNED_IN;

  const parsed = idSchema.safeParse({ id: formData.get("productId") });
  if (!parsed.success) return { ok: false, message: "That request was malformed." };

  // updateMany rather than update: a stale id from an already-deleted listing
  // is a no-op instead of a thrown 500 on a page the admin is still reading.
  const { count } = await prisma.product.updateMany({
    where: { id: parsed.data.id },
    data: { isActive },
  });
  if (count === 0) return { ok: false, message: "That listing no longer exists." };

  revalidateProductViews();
  return { ok: true };
}

export async function deleteProduct(formData: FormData): Promise<ActionResult> {
  if (!(await isSignedIn())) return NOT_SIGNED_IN;

  const parsed = idSchema.safeParse({ id: formData.get("productId") });
  if (!parsed.success) return { ok: false, message: "That request was malformed." };

  await prisma.product.deleteMany({ where: { id: parsed.data.id } });

  revalidateProductViews();
  return { ok: true };
}

// --------------------------------------------------------------------- buyers

export async function setCustomerStatus(
  status: "ACTIVE" | "SUSPENDED",
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isSignedIn())) return NOT_SIGNED_IN;

  const parsed = idSchema.safeParse({ id: formData.get("customerId") });
  if (!parsed.success) return { ok: false, message: "That request was malformed." };

  const { count } = await prisma.customer.updateMany({
    where: { id: parsed.data.id },
    data: { status },
  });
  if (count === 0) return { ok: false, message: "That account no longer exists." };

  revalidatePath("/tj/buyers");
  return { ok: true };
}

/**
 * Erase a buyer.
 *
 * Their shortlists cascade away with them. There is no soft-delete tombstone:
 * the account holds nothing but an email, a name and a list of things they
 * liked, so "delete" here means what the word means.
 */
export async function deleteCustomer(formData: FormData): Promise<ActionResult> {
  if (!(await isSignedIn())) return NOT_SIGNED_IN;

  const parsed = idSchema.safeParse({ id: formData.get("customerId") });
  if (!parsed.success) return { ok: false, message: "That request was malformed." };

  await prisma.customer.deleteMany({ where: { id: parsed.data.id } });

  revalidatePath("/tj/buyers");
  return { ok: true };
}

// --------------------------------------------------------------------- farms

/**
 * Erase a farm and everything it published.
 *
 * Product.farmerId is onDelete: Restrict, so the listings have to go first or
 * the delete is refused. Both run in one transaction: a farm half-deleted, with
 * its listings gone but its page still live, would be worse than either state.
 */
export async function deleteFarmer(formData: FormData): Promise<ActionResult> {
  if (!(await isSignedIn())) return NOT_SIGNED_IN;

  const parsed = idSchema.safeParse({ id: formData.get("farmerId") });
  if (!parsed.success) return { ok: false, message: "That request was malformed." };

  const id = parsed.data.id;
  await prisma.$transaction([
    prisma.product.deleteMany({ where: { farmerId: id } }),
    prisma.farmer.deleteMany({ where: { id } }),
  ]);

  revalidateProductViews();
  revalidatePath("/tj");
  return { ok: true };
}

function revalidateProductViews(): void {
  revalidatePath("/tj");
  revalidatePath("/tj/farmers");
  revalidatePath("/ta/products");
  revalidatePath("/ta/farmers");
  revalidatePath("/ta");
}

// --------------------------------------------------------------------- stores

const storeDecisionSchema = z.object({
  storeId: z.string().min(1).max(60),
  note: z.string().max(500).optional(),
});

export async function decideStore(
  status: "VERIFIED" | "REJECTED" | "SUSPENDED" | "PENDING",
  formData: FormData,
): Promise<ActionResult> {
  // Server Actions are reachable by anyone who knows the action id, so the
  // session is re-checked here rather than trusted from the page that rendered.
  if (!(await isSignedIn())) return NOT_SIGNED_IN;

  const parsed = storeDecisionSchema.safeParse({
    storeId: formData.get("storeId"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return { ok: false, message: "That request was malformed." };

  const { count } = await prisma.organicStore.updateMany({
    where: { id: parsed.data.storeId },
    data: {
      status,
      // Cleared on the way out for the same reason it is on a farm: the public
      // query gates on status, but the "checked" badge reads verifiedAt.
      verifiedAt: status === "VERIFIED" ? new Date() : null,
      ...(parsed.data.note ? { reviewNote: parsed.data.note } : {}),
    },
  });
  if (count === 0) return { ok: false, message: "That shop no longer exists." };

  revalidateStoreViews();
  return { ok: true };
}

export async function deleteStore(formData: FormData): Promise<ActionResult> {
  if (!(await isSignedIn())) return NOT_SIGNED_IN;

  const parsed = idSchema.safeParse({ id: formData.get("storeId") });
  if (!parsed.success) return { ok: false, message: "That request was malformed." };

  // A shop owns no listings, so unlike a farm this needs no transaction.
  await prisma.organicStore.deleteMany({ where: { id: parsed.data.id } });

  revalidateStoreViews();
  return { ok: true };
}

function revalidateStoreViews(): void {
  revalidatePath("/tj/stores");
  revalidatePath("/ta/stores");
  revalidatePath("/ta");
}

// ------------------------------------------------------------------- messages

/**
 * Mark a contact message answered, or put it back in the queue.
 *
 * Nothing is deleted: the message is the only record that someone wrote in, and
 * an admin closing one by mistake should be able to reopen it.
 */
export async function setMessageHandled(
  handled: boolean,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isSignedIn())) return NOT_SIGNED_IN;

  const parsed = idSchema.safeParse({ id: formData.get("messageId") });
  if (!parsed.success) return { ok: false, message: "That request was malformed." };

  const { count } = await prisma.contactMessage.updateMany({
    where: { id: parsed.data.id },
    data: { handledAt: handled ? new Date() : null },
  });
  if (count === 0) return { ok: false, message: "That message no longer exists." };

  revalidatePath("/tj/messages");
  return { ok: true };
}
