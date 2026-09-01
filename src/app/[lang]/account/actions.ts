"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { loadConfig } from "@conf/config";
import { passwordChangeSchema, profileSchema, signInSchema, signUpSchema } from "@/lib/account-schema";
import {
  accountsEnabled,
  endSession,
  getCustomer,
  startSession,
} from "@/lib/customer-auth";
import { en } from "@/lib/i18n/dictionaries/en";
import { ta } from "@/lib/i18n/dictionaries/ta";
import { localePath, safeNext, type Locale } from "@/lib/i18n/config";
import { fakeVerify, hashPassword, verifyPassword } from "@/lib/password";
import {
  consumeResetToken,
  issueResetToken,
  resetAvailable,
  sendResetEmail,
} from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { clientKeyFromHeaders } from "@/lib/rate-limit";
import { regionIdForCustomer } from "@/lib/regions";
import { consumeRateLimit } from "@/lib/session-store";

export type ActionState = {
  error?: string;
  fields?: string[];
  // Echoed back so a rejected form is not wiped. The password is deliberately
  // never echoed.
  values?: Record<string, string>;
  ok?: boolean;
};

function clientKey(list: Headers): string {
  return clientKeyFromHeaders(list);
}

function fieldsFrom(issues: { path: PropertyKey[] }[]): string[] {
  return [...new Set(issues.map((issue) => String(issue.path[0] ?? "form")))];
}

function textValues(form: FormData, keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, String(form.get(key) ?? "")]));
}

async function limit(bucket: string, limitCount: number, windowSeconds: number) {
  const list = await headers();
  return consumeRateLimit(`${bucket}:${clientKey(list)}`, limitCount, windowSeconds);
}

export async function signUpAction(
  locale: Locale,
  next: string | null,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!accountsEnabled()) return { error: "unavailable" };

  const values = textValues(form, ["name", "email", "phone", "region"]);
  // 20/hour, not 5: Indian mobile carriers put whole cities behind one CGNAT
  // address, so a tight per-IP cap locks out strangers rather than attackers.
  const gate = await limit("signup", 20, 3600);
  if (!gate.allowed) return { error: "rateLimited", values };

  const parsed = signUpSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
    phone: form.get("phone") ?? "",
    region: form.get("region") ?? "",
  });

  if (!parsed.success) {
    return { error: "invalid", fields: fieldsFrom(parsed.error.issues), values };
  }

  const { name, email, password, phone, region } = parsed.data;
  const passwordHash = await hashPassword(password);

  try {
    const customer = await prisma.customer.create({
      data: {
        email,
        passwordHash,
        passwordSetAt: new Date(),
        name,
        phone: phone || null,
        regionId: await regionIdForCustomer(region),
        locale,
      },
      select: { id: true },
    });
    await startSession(customer.id);
  } catch {
    // Includes the unique-email violation. Deliberately the same message as any
    // other failure: "that email is taken" tells a stranger who has an account.
    return { error: "signUpFailed", values };
  }

  redirect(safeNext(next ?? undefined, locale) ?? localePath(locale, "/account"));
}

export async function signInAction(
  locale: Locale,
  next: string | null,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!accountsEnabled()) return { error: "unavailable" };

  const values = textValues(form, ["email"]);
  const parsed = signInSchema.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });

  if (!parsed.success) return { error: "badCredentials", values };

  const { email, password } = parsed.data;

  // Two buckets. The per-account one stops someone guessing one person's
  // password; the looser per-IP one stops a spray across many accounts without
  // letting one shared carrier address lock out a whole town.
  const perAccount = await consumeRateLimit(`signin-acct:${email}`, 8, 900);
  const perIp = await limit("signin-ip", 40, 900);
  if (!perAccount.allowed || !perIp.allowed) return { error: "rateLimited", values };

  const customer = await prisma.customer.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  if (!customer) {
    // Spend the same time as a real verification so the response cannot be used
    // to work out which addresses are registered.
    await fakeVerify(password);
    return { error: "badCredentials", values };
  }

  if (!(await verifyPassword(password, customer.passwordHash))) {
    return { error: "badCredentials", values };
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { lastSeenAt: new Date() },
  });
  await startSession(customer.id);

  redirect(safeNext(next ?? undefined, locale) ?? localePath(locale, "/account"));
}

export async function signOutAction(locale: Locale): Promise<void> {
  await endSession();
  redirect(localePath(locale, "/"));
}

export async function changePasswordAction(
  locale: Locale,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const customer = await getCustomer();
  if (!customer) return { error: "unavailable" };

  const gate = await limit("password", 8, 900);
  if (!gate.allowed) return { error: "rateLimited" };

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: form.get("currentPassword"),
    newPassword: form.get("newPassword"),
  });

  if (!parsed.success) {
    return { error: "invalid", fields: fieldsFrom(parsed.error.issues) };
  }

  const row = await prisma.customer.findUnique({
    where: { id: customer.id },
    select: { passwordHash: true },
  });
  if (!row || !(await verifyPassword(parsed.data.currentPassword, row.passwordHash))) {
    return { error: "badCurrentPassword", fields: ["currentPassword"] };
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword), passwordSetAt: new Date() },
  });

  // Everything else stays signed in on purpose: the point of changing a password
  // is usually that someone else may have it, so the old sessions have to go.
  await endSession();
  redirect(localePath(locale, "/account/sign-in?changed=1"));
}

export async function deleteAccountAction(locale: Locale, form: FormData): Promise<void> {
  const customer = await getCustomer();
  if (!customer) redirect(localePath(locale, "/"));

  // Typed confirmation and the password, matching the bar already set for the
  // far less destructive password change. Either language's word is accepted:
  // a Tamil-first product should not demand an English one.
  const typed = String(form.get("confirm") ?? "").trim().toLowerCase();
  const confirmed = typed === "delete" || typed === ta.account.dangerConfirm.toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!confirmed) redirect(localePath(locale, "/account?problem=confirm"));

  const row = await prisma.customer.findUnique({
    where: { id: customer.id },
    select: { passwordHash: true },
  });
  if (!row || !(await verifyPassword(password, row.passwordHash))) {
    redirect(localePath(locale, "/account?problem=password"));
  }

  await endSession();
  // Saved rows go with it: both join tables are ON DELETE CASCADE.
  await prisma.customer.delete({ where: { id: customer.id } });
  redirect(localePath(locale, "/?deleted=1"));
}

export async function requestResetAction(
  locale: Locale,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!accountsEnabled() || !resetAvailable()) return { error: "unavailable" };

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const gate = await limit("reset-req", 6, 900);
  // The same answer either way, so this cannot be used to enumerate addresses.
  if (!gate.allowed) return { ok: true };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: true };

  const customer = await prisma.customer.findUnique({
    where: { email },
    select: { id: true },
  });

  if (customer) {
    const token = await issueResetToken(customer.id);
    const { app } = loadConfig();
    const url = `${app.site_url}${localePath(locale, "/account/reset")}?token=${token}`;
    const t = locale === "ta" ? ta : en;
    try {
      await sendResetEmail(email, url, t.account.resetEmailSubject, t.account.resetEmailBody);
    } catch {
      // Swallowed on purpose: a mail failure must not tell the sender whether
      // the address exists.
    }
  }

  return { ok: true };
}

export async function performResetAction(
  locale: Locale,
  token: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (!accountsEnabled() || !resetAvailable()) return { error: "unavailable" };

  const gate = await limit("reset-do", 10, 900);
  if (!gate.allowed) return { error: "rateLimited" };

  const password = String(form.get("password") ?? "");
  if (password.length < 10) return { error: "invalid", fields: ["password"] };

  const customerId = await consumeResetToken(token);
  if (!customerId) return { error: "resetExpired" };

  await prisma.customer.update({
    where: { id: customerId },
    data: { passwordHash: await hashPassword(password), passwordSetAt: new Date() },
  });

  redirect(localePath(locale, "/account/sign-in?reset=1"));
}

export async function updateProfileAction(
  locale: Locale,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const customer = await getCustomer();
  if (!customer) return { error: "unavailable" };

  const parsed = profileSchema.safeParse({
    name: form.get("name"),
    phone: form.get("phone") ?? "",
    region: form.get("region") ?? "",
    locale: form.get("locale"),
  });

  if (!parsed.success) {
    return {
      error: "invalid",
      fields: fieldsFrom(parsed.error.issues),
      values: textValues(form, ["name", "phone", "region"]),
    };
  }

  const next = parsed.data;
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      name: next.name,
      phone: next.phone || null,
      regionId: await regionIdForCustomer(next.region),
      locale: next.locale,
    },
  });

  // Language is part of the profile, so saving a different one moves the user
  // to that version of the site rather than quietly disagreeing with the toggle.
  if (next.locale !== locale) redirect(localePath(next.locale, "/account"));

  revalidatePath(localePath(locale, "/account"));
  return { ok: true };
}

/** Toggles a saved item. Returns the new state so the button can flip. */
export async function toggleSavedProductAction(productId: string): Promise<boolean> {
  const customer = await getCustomer();
  if (!customer) return false;

  const existing = await prisma.savedProduct.findUnique({
    where: { customerId_productId: { customerId: customer.id, productId } },
    select: { productId: true },
  });

  if (existing) {
    await prisma.savedProduct.delete({
      where: { customerId_productId: { customerId: customer.id, productId } },
    });
    return false;
  }

  await prisma.savedProduct.create({ data: { customerId: customer.id, productId } });
  return true;
}

export async function toggleSavedFarmerAction(farmerId: string): Promise<boolean> {
  const customer = await getCustomer();
  if (!customer) return false;

  const existing = await prisma.savedFarmer.findUnique({
    where: { customerId_farmerId: { customerId: customer.id, farmerId } },
    select: { farmerId: true },
  });

  if (existing) {
    await prisma.savedFarmer.delete({
      where: { customerId_farmerId: { customerId: customer.id, farmerId } },
    });
    return false;
  }

  await prisma.savedFarmer.create({ data: { customerId: customer.id, farmerId } });
  return true;
}
