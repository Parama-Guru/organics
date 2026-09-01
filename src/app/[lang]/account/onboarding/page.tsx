import { notFound, redirect } from "next/navigation";

import { AccountShell } from "@/components/account-shell";
import { ProfileForm } from "@/components/profile-form";
import { accountsEnabled, getCustomer } from "@/lib/customer-auth";
import { localePath, safeNext } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.account.onboardingTitle, robots: { index: false, follow: false } };
}

export default async function OnboardingPage({ searchParams }: PageProps<"/[lang]/account/onboarding">) {
  if (!accountsEnabled()) notFound();

  const [locale, t, customer, params] = await Promise.all([
    getLocale(),
    getDictionary(),
    getCustomer(),
    searchParams,
  ]);
  if (!customer) redirect(localePath(locale, "/account/sign-in"));

  const next = safeNext(typeof params.next === "string" ? params.next : undefined, locale) ??
    localePath(locale, "/account");
  if (customer.profileCompletedAt) redirect(next);

  return (
    <AccountShell t={t} title={t.account.onboardingTitle} intro={t.account.onboardingIntro}>
        <ProfileForm
          name=""
          phone={customer.phone ?? ""}
          region={customer.region?.name ?? ""}
          profileLocale={customer.locale}
          next={next}
        />
    </AccountShell>
  );
}
