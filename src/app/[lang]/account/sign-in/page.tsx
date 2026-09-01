import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AccountForm } from "@/components/account-form";
import { GlassPanel } from "@/components/glass-panel";
import { CheckIcon } from "@/components/ui/icons";
import { accountsEnabled, getCustomer } from "@/lib/customer-auth";
import { resetAvailable } from "@/lib/password-reset";
import { localePath, safeNext } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.account.signInTitle, robots: { index: false, follow: false } };
}

export default async function SignInPage({ searchParams }: PageProps<"/[lang]/account/sign-in">) {
  if (!accountsEnabled()) notFound();

  const [locale, t, params] = await Promise.all([getLocale(), getDictionary(), searchParams]);
  if (await getCustomer()) redirect(localePath(locale, "/account"));

  const next = safeNext(typeof params.next === "string" ? params.next : undefined, locale);

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <GlassPanel className="rounded-3xl p-7 sm:p-8">
        <h1 className="font-display text-3xl">{t.account.signInTitle}</h1>
        <p className="mt-2 leading-relaxed text-ink">{t.account.signInIntro}</p>

        {/* Arriving straight from a reset or a password change, saying nothing
            would look like the change had failed. */}
        {params.reset === "1" || params.changed === "1" ? (
          <p
            role="status"
            className="mt-4 flex items-start gap-2 rounded-xl bg-leaf-50 p-3 text-sm leading-relaxed text-leaf-800 ring-1 ring-inset ring-leaf-200"
          >
            <CheckIcon className="mt-0.5 shrink-0" />{" "}
            {params.changed === "1" ? t.account.changedDone : t.account.resetDone}
          </p>
        ) : null}

        <AccountForm mode="signIn" next={next ?? undefined} />

        {resetAvailable() ? (
          <Link
            href={localePath(locale, "/account/forgot")}
            className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-brand underline underline-offset-4"
          >
            {t.account.forgot}
          </Link>
        ) : null}
      </GlassPanel>
    </div>
  );
}
