import { notFound } from "next/navigation";

import { AccountShell } from "@/components/account-shell";
import { RequestResetForm } from "@/components/reset-forms";
import { accountsEnabled } from "@/lib/customer-auth";
import { resetAvailable } from "@/lib/password-reset";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.account.forgotTitle, robots: { index: false, follow: false } };
}

export default async function ForgotPasswordPage() {
  if (!accountsEnabled() || !resetAvailable()) notFound();
  const t = await getDictionary();

  return (
    <AccountShell t={t} title={t.account.forgotTitle} intro={t.account.forgotIntro}>
      <RequestResetForm />
    </AccountShell>
  );
}
