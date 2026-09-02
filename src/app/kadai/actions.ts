"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { fakeVerify, hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { clientKeyFromHeaders } from "@/lib/rate-limit";
import { consumeRateLimit } from "@/lib/session-store";
import {
  STORE_PORTAL,
  consumeStoreInvite,
  endStoreSession,
  getStore,
  startStoreSession,
  storePortalEnabled,
} from "@/lib/store-auth";
import { storeProfileSchema } from "@/lib/store-profile-schema";

export type StorePortalState = {
  error?: string;
  fields?: string[];
  values?: Record<string, string>;
};

async function limit(bucket: string, count: number, windowSeconds: number) {
  const list = await headers();
  return consumeRateLimit(
    `${bucket}:${clientKeyFromHeaders(list)}`,
    count,
    windowSeconds,
  );
}

function fieldsFrom(issues: { path: PropertyKey[] }[]): string[] {
  return [...new Set(issues.map((issue) => String(issue.path[0] ?? "form")))];
}

export async function storeSignInAction(
  _prev: StorePortalState,
  form: FormData,
): Promise<StorePortalState> {
  if (!storePortalEnabled()) return { error: "unavailable" };

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const values = { email };

  const [perAccount, perIp] = await Promise.all([
    consumeRateLimit(`store-signin:${email}`, 8, 900),
    limit("store-signin-ip", 30, 900),
  ]);
  if (!perAccount.allowed || !perIp.allowed) return { error: "rateLimited", values };

  const store = await prisma.organicStore.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      status: true,
      portalEnabledAt: true,
      portalSessionVersion: true,
    },
  });

  // Pay one scrypt cost even when no usable account exists, so response time
  // does not reveal whether an email belongs to a registered store.
  const passwordMatches = store?.passwordHash
    ? await verifyPassword(password, store.passwordHash)
    : await fakeVerify(password).then(() => false);
  const ok =
    passwordMatches &&
    store?.status === "VERIFIED" &&
    Boolean(store.portalEnabledAt);

  if (!ok || !store) return { error: "badCredentials", values };

  await prisma.organicStore.update({
    where: { id: store.id },
    data: { lastSignInAt: new Date() },
  });
  await startStoreSession(store.id, store.portalSessionVersion);
  redirect(STORE_PORTAL);
}

export async function storeSignOutAction(): Promise<void> {
  await endStoreSession();
  redirect(`${STORE_PORTAL}/sign-in`);
}

export async function acceptStoreInviteAction(
  storeId: string,
  token: string,
  _prev: StorePortalState,
  form: FormData,
): Promise<StorePortalState> {
  if (!storePortalEnabled()) return { error: "unavailable" };

  const [perStore, perIp] = await Promise.all([
    consumeRateLimit(`store-invite:${storeId}`, 10, 900),
    limit("store-invite-ip", 20, 900),
  ]);
  if (!perStore.allowed || !perIp.allowed) return { error: "rateLimited" };

  const password = String(form.get("password") ?? "");
  if (password.length < 10 || password.trim().length < 10) {
    return { error: "invalid", fields: ["password"] };
  }

  const store = await prisma.organicStore.findFirst({
    where: { id: storeId, status: "VERIFIED" },
    select: { id: true, email: true },
  });
  if (!store) return { error: "inviteExpired" };
  const emailName = store.email.split("@")[0]?.toLowerCase();
  if (emailName && password.toLowerCase().includes(emailName)) {
    return { error: "emailPassword", fields: ["password"] };
  }

  const valid = await consumeStoreInvite(storeId, token);
  if (!valid) return { error: "inviteExpired" };

  const updated = await prisma.organicStore.update({
    where: { id: store.id },
    data: {
      passwordHash: await hashPassword(password),
      portalEnabledAt: new Date(),
      portalSessionVersion: { increment: 1 },
    },
    select: { portalSessionVersion: true },
  });

  await startStoreSession(store.id, updated.portalSessionVersion);
  redirect(STORE_PORTAL);
}

export async function updateStoreProfileAction(
  _prev: StorePortalState,
  form: FormData,
): Promise<StorePortalState> {
  const store = await getStore();
  if (!store) redirect(`${STORE_PORTAL}/sign-in`);

  const values = {
    phone: String(form.get("phone") ?? ""),
    addressLine: String(form.get("addressLine") ?? ""),
    about: String(form.get("about") ?? ""),
    aboutTa: String(form.get("aboutTa") ?? ""),
  };
  const parsed = storeProfileSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "invalid",
      fields: fieldsFrom(parsed.error.issues),
      values,
    };
  }

  const changed = await prisma.organicStore.updateMany({
    where: { id: store.id, status: "VERIFIED" },
    data: {
      phone: parsed.data.phone,
      addressLine: parsed.data.addressLine,
      about: parsed.data.about,
      aboutTa: parsed.data.aboutTa || null,
    },
  });
  if (changed.count !== 1) return { error: "unavailable", values };

  revalidatePath(STORE_PORTAL);
  revalidatePath(`${STORE_PORTAL}/profile`);
  revalidatePath("/ta/stores");
  revalidatePath("/en/stores");
  revalidatePath(`/ta/stores/${store.slug}`);
  revalidatePath(`/en/stores/${store.slug}`);
  redirect(`${STORE_PORTAL}/profile?saved=1`);
}

export async function setStoreEnquiryReadAction(
  enquiryId: string,
  read: boolean,
): Promise<void> {
  const store = await getStore();
  if (!store) redirect(`${STORE_PORTAL}/sign-in`);

  await prisma.privateEnquiry.updateMany({
    where: { id: enquiryId, storeId: store.id },
    data: { sellerReadAt: read ? new Date() : null },
  });
  revalidatePath(`${STORE_PORTAL}/enquiries`);
  revalidatePath(STORE_PORTAL);
}
