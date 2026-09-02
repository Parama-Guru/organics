import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AccountForm } from "@/components/account-form";
import { AccountShell } from "@/components/account-shell";
import { GoogleSignIn } from "@/components/google-sign-in";
import { accountsEnabled, getCustomer } from "@/lib/customer-auth";
import { googleOAuthEnabled } from "@/lib/google-auth";
import { localePath, safeNext } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.account.signUpTitle, robots: { index: false, follow: false } };
}

export default async function SignUpPage({ searchParams }: PageProps<"/[lang]/account/sign-up">) {
  if (!accountsEnabled()) notFound();

  const [locale, t, params] = await Promise.all([getLocale(), getDictionary(), searchParams]);
  if (await getCustomer()) redirect(localePath(locale, "/account"));

  const next = safeNext(typeof params.next === "string" ? params.next : undefined, locale);

  return (
    <AccountShell t={t} title={t.account.signUpTitle} intro={t.account.signUpIntro}>
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
        <AccountForm mode="signUp" next={next ?? undefined} />
        <p className="mt-6 border-t border-bark-200/60 pt-4 text-sm leading-relaxed text-bark-600">
          {t.account.privacyNote}{" "}
          <Link
            href={localePath(locale, "/privacy")}
            className="font-semibold text-brand underline underline-offset-4"
          >
            {t.footer.privacy}
          </Link>
          {" "}{t.legal.signupAgreement}{" "}
          <Link
            href={localePath(locale, "/terms")}
            className="font-semibold text-brand underline underline-offset-4"
          >
            {t.footer.terms}
          </Link>
        </p>
    </AccountShell>
  );
}
