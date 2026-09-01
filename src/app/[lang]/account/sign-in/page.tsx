import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AccountForm } from "@/components/account-form";
import { AccountShell } from "@/components/account-shell";
import { GoogleSignIn } from "@/components/google-sign-in";
import { CheckIcon } from "@/components/ui/icons";
import { accountsEnabled, getCustomer } from "@/lib/customer-auth";
import { googleOAuthEnabled } from "@/lib/google-auth";
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
  const oauthErrors = {
    unverified: t.account.oauthUnverified,
    alreadyLinked: t.account.oauthLinkedElsewhere,
    emailInUse: t.account.oauthEmailInUse,
    wrongGoogle: t.account.oauthWrongGoogle,
    unavailable: t.account.oauthUnavailable,
  } as const;
  const oauthCode = typeof params.oauth === "string" ? params.oauth : "";
  const oauthError = oauthErrors[oauthCode as keyof typeof oauthErrors] ??
    (oauthCode ? t.account.oauthInvalid : null);

  return (
    <AccountShell t={t} title={t.account.signInTitle} intro={t.account.signInIntro}>

        {googleOAuthEnabled() ? (
          <div className="mt-6">
            <GoogleSignIn
              locale={locale}
              next={next ?? localePath(locale, "/account")}
              label={t.account.continueGoogle}
            />
            <p className="my-4 text-center text-sm text-bark-600">{t.account.orPassword}</p>
          </div>
        ) : null}

        {oauthError ? (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {oauthError}
          </p>
        ) : null}

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
    </AccountShell>
  );
}
