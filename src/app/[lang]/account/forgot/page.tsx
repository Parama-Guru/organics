import { notFound } from "next/navigation";

import { GlassPanel } from "@/components/glass-panel";
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
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <GlassPanel className="rounded-3xl p-7 sm:p-8">
        <h1 className="font-display text-3xl">{t.account.forgotTitle}</h1>
        <p className="mt-2 leading-relaxed text-ink">{t.account.forgotIntro}</p>
        <RequestResetForm />
      </GlassPanel>
    </div>
  );
}
