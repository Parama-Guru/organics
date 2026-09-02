"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  FARMER_PORTAL,
  consumeFarmerInvite,
  endFarmerSession,
  farmerPortalEnabled,
  getFarmer,
  startFarmerSession,
} from "@/lib/farmer-auth";
import {
  createFarmerProduct,
  deleteFarmerProduct,
  farmerProductSchema,
  setFarmerProductActive,
  updateFarmerProduct,
} from "@/lib/farmer-products";
import { fakeVerify, hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { clientKeyFromHeaders } from "@/lib/rate-limit";
import { consumeRateLimit } from "@/lib/session-store";

export type PortalState = { error?: string; fields?: string[]; values?: Record<string, string> };

function clientKey(list: Headers): string {
  return clientKeyFromHeaders(list);
}

async function limit(bucket: string, count: number, windowSeconds: number) {
  const list = await headers();
  return consumeRateLimit(`${bucket}:${clientKey(list)}`, count, windowSeconds);
}

function fieldsFrom(issues: { path: PropertyKey[] }[]): string[] {
  return [...new Set(issues.map((issue) => String(issue.path[0] ?? "form")))];
}

function textValues(form: FormData, keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, String(form.get(key) ?? "")]));
}

const PRODUCT_FIELDS = [
  "nameTa",
  "name",
  "descriptionTa",
  "description",
  "price",
  "unit",
  "stock",
  "categoryId",
  "regionId",
];

function productFields(form: FormData) {
  return {
    nameTa: form.get("nameTa") ?? "",
    name: form.get("name") ?? "",
    descriptionTa: form.get("descriptionTa") ?? "",
    description: form.get("description") ?? "",
    price: form.get("price"),
    unit: form.get("unit"),
    stock: form.get("stock") ?? "",
    categoryId: form.get("categoryId"),
    regionId: form.get("regionId") ?? "",
    isActive: form.get("isActive") ?? "",
  };
}

export async function farmerSignInAction(
  _prev: PortalState,
  form: FormData,
): Promise<PortalState> {
  if (!farmerPortalEnabled()) return { error: "unavailable" };

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const values = { email };

  const perAccount = await consumeRateLimit(`farmer-signin:${email}`, 8, 900);
  const perIp = await limit("farmer-signin-ip", 30, 900);
  if (!perAccount.allowed || !perIp.allowed) return { error: "rateLimited", values };

  const farmer = await prisma.farmer.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      status: true,
      portalEnabledAt: true,
      portalSessionVersion: true,
    },
  });

  // One message for every failure, so the form cannot be used to work out which
  // farms exist or which are suspended.
  const passwordMatches = farmer?.passwordHash
    ? await verifyPassword(password, farmer.passwordHash)
    : await fakeVerify(password).then(() => false);
  const ok =
    passwordMatches &&
    farmer?.status === "VERIFIED" &&
    Boolean(farmer.portalEnabledAt);

  if (!ok || !farmer) return { error: "badCredentials", values };

  await prisma.farmer.update({
    where: { id: farmer.id },
    data: { lastSignInAt: new Date() },
  });
  await startFarmerSession(farmer.id, farmer.portalSessionVersion);
  redirect(FARMER_PORTAL);
}

export async function farmerSignOutAction(): Promise<void> {
  await endFarmerSession();
  redirect(`${FARMER_PORTAL}/sign-in`);
}

export async function acceptInviteAction(
  farmId: string,
  token: string,
  _prev: PortalState,
  form: FormData,
): Promise<PortalState> {
  if (!farmerPortalEnabled()) return { error: "unavailable" };

  // Per farm as well as per IP: the per-IP bucket alone let one address work
  // through many farms, and the per-farm bucket alone let one farm be attacked
  // from many addresses.
  const perFarm = await consumeRateLimit(`farmer-invite:${farmId}`, 10, 900);
  const perIp = await limit("farmer-invite-ip", 20, 900);
  if (!perFarm.allowed || !perIp.allowed) return { error: "rateLimited" };

  const password = String(form.get("password") ?? "");
  if (password.length < 10 || password.trim().length < 10) {
    return { error: "invalid", fields: ["password"] };
  }

  // Re-checked here, not just on the page that drew the form: the farm may have
  // been suspended between the link being opened and the password being typed.
  const farmer = await prisma.farmer.findFirst({
    where: { id: farmId, status: "VERIFIED" },
    select: { id: true, email: true },
  });
  if (!farmer) return { error: "inviteExpired" };
  const emailName = farmer.email.split("@")[0]?.toLowerCase();
  if (emailName && password.toLowerCase().includes(emailName)) {
    return { error: "emailPassword", fields: ["password"] };
  }

  // Atomically consumed only when the supplied token exactly matches, after
  // all password checks so a correct link is not burned by invalid input.
  const valid = await consumeFarmerInvite(farmId, token);
  if (!valid) return { error: "inviteExpired" };

  const updated = await prisma.farmer.update({
    where: { id: farmer.id },
    data: {
      passwordHash: await hashPassword(password),
      portalEnabledAt: new Date(),
      portalSessionVersion: { increment: 1 },
    },
    select: { portalSessionVersion: true },
  });

  await startFarmerSession(farmer.id, updated.portalSessionVersion);
  redirect(FARMER_PORTAL);
}

// ---- product management. Every call re-reads the session; the farm id is never
// taken from the form, so a forged id cannot reach another farm's rows. --------

export async function createProductAction(
  _prev: PortalState,
  form: FormData,
): Promise<PortalState> {
  const farmer = await getFarmer();
  if (!farmer) redirect(`${FARMER_PORTAL}/sign-in`);

  const parsed = farmerProductSchema.safeParse(productFields(form));

  if (!parsed.success) {
    return {
      error: "invalid",
      fields: fieldsFrom(parsed.error.issues),
      values: textValues(form, PRODUCT_FIELDS),
    };
  }

  await createFarmerProduct(farmer.id, farmer.slug, parsed.data);
  revalidatePath(FARMER_PORTAL);
  redirect(`${FARMER_PORTAL}?added=1`);
}

export async function updateProductAction(
  productId: string,
  _prev: PortalState,
  form: FormData,
): Promise<PortalState> {
  const farmer = await getFarmer();
  if (!farmer) redirect(`${FARMER_PORTAL}/sign-in`);

  const parsed = farmerProductSchema.safeParse(productFields(form));

  if (!parsed.success) {
    return {
      error: "invalid",
      fields: fieldsFrom(parsed.error.issues),
      values: textValues(form, PRODUCT_FIELDS),
    };
  }

  const changed = await updateFarmerProduct(farmer.id, productId, parsed.data);
  if (!changed) return { error: "notYours" };

  revalidatePath(FARMER_PORTAL);
  redirect(`${FARMER_PORTAL}?saved=1`);
}

export async function deleteProductAction(productId: string): Promise<void> {
  const farmer = await getFarmer();
  if (!farmer) redirect(`${FARMER_PORTAL}/sign-in`);

  await deleteFarmerProduct(farmer.id, productId);
  revalidatePath(FARMER_PORTAL);
  redirect(`${FARMER_PORTAL}?removed=1`);
}

export async function toggleProductActiveAction(
  productId: string,
  isActive: boolean,
): Promise<void> {
  const farmer = await getFarmer();
  if (!farmer) redirect(`${FARMER_PORTAL}/sign-in`);

  await setFarmerProductActive(farmer.id, productId, isActive);
  revalidatePath(FARMER_PORTAL);
}

export async function setFarmerEnquiryReadAction(
  enquiryId: string,
  read: boolean,
): Promise<void> {
  const farmer = await getFarmer();
  if (!farmer) redirect(`${FARMER_PORTAL}/sign-in`);

  await prisma.privateEnquiry.updateMany({
    where: { id: enquiryId, farmerId: farmer.id },
    data: { sellerReadAt: read ? new Date() : null },
  });
  revalidatePath(`${FARMER_PORTAL}/enquiries`);
  revalidatePath(FARMER_PORTAL);
}
