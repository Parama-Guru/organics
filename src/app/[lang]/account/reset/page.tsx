import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountShell } from "@/components/account-shell";
import { ResetForm } from "@/components/reset-forms";
import { accountsEnabled } from "@/lib/customer-auth";
import { resetAvailable } from "@/lib/password-reset";
import { localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.account.resetTitle, robots: { index: false, follow: false } };
}

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/[lang]/account/reset">) {
  if (!accountsEnabled() || !resetAvailable()) notFound();

  const [locale, t, params] = await Promise.all([getLocale(), getDictionary(), searchParams]);
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <AccountShell t={t} title={t.account.resetTitle} intro={token ? t.account.passwordHint : t.account.resetExpired}>
        {token ? (
          <ResetForm token={token} />
        ) : (
          <>
            <p className="mt-3 leading-relaxed text-ink">{t.account.resetExpired}</p>
            <Link
              href={localePath(locale, "/account/forgot")}
              className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4"
            >
              {t.account.forgotTitle}
            </Link>
          </>
        )}
    </AccountShell>
  );
}
