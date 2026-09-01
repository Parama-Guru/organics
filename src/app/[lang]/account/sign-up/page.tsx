import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AccountForm } from "@/components/account-form";
import { GlassPanel } from "@/components/glass-panel";
import { accountsEnabled, getCustomer } from "@/lib/customer-auth";
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
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <GlassPanel className="rounded-3xl p-7 sm:p-8">
        <h1 className="font-display text-3xl">{t.account.signUpTitle}</h1>
        <p className="mt-2 leading-relaxed text-ink">{t.account.signUpIntro}</p>
        <AccountForm mode="signUp" next={next ?? undefined} />
        <p className="mt-6 border-t border-bark-200/60 pt-4 text-sm leading-relaxed text-bark-600">
          {t.account.privacyNote}{" "}
          <Link
            href={localePath(locale, "/privacy")}
            className="font-semibold text-brand underline underline-offset-4"
          >
            {t.footer.privacy}
          </Link>
        </p>
      </GlassPanel>
    </div>
  );
}
