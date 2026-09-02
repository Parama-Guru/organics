import Link from "next/link";

import { loadConfig } from "@conf/config";
import { localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.legal.refundsHeading, description: t.legal.refundsIntro };
}

export default async function RefundsPage() {
  const [t, locale] = await Promise.all([getDictionary(), getLocale()]);
  const sections = [
    { title: t.legal.refundsSellerTitle, body: t.legal.refundsSellerBody },
    { title: t.legal.refundsAccessTitle, body: t.legal.refundsAccessBody },
    { title: t.legal.refundsCancelTitle, body: t.legal.refundsCancelBody },
    { title: t.legal.refundsEligibleTitle, body: t.legal.refundsEligibleBody },
    { title: t.legal.refundsProcessTitle, body: t.legal.refundsProcessBody },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
      <header className="border-b border-bark-200 pb-10 sm:pb-14">
      <p className="section-kicker">Legal field note</p>
      <h1 className="editorial-heading mt-6">{t.legal.refundsHeading}</h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bark-600 sm:text-xl">{t.legal.refundsIntro}</p>
      <p className="mt-3 font-mono text-xs uppercase tracking-[0.1em] text-bark-600">{t.legal.effective}</p>
      </header>

      {!loadConfig().billing.enabled ? (
        <p className="mt-6 rounded-2xl border border-leaf-200 bg-leaf-50 p-4 text-sm leading-relaxed text-leaf-800">
          {t.legal.termsBillingDisabled}
        </p>
      ) : null}

      <div className="mt-10 border-t border-bark-200">
        {sections.map((section, index) => (
          <section key={section.title} className="grid gap-4 border-b border-bark-200 py-8 sm:grid-cols-[4rem_0.8fr_1.2fr] sm:py-10">
            <span className="font-mono text-xs text-leaf-700">0{index + 1}</span>
            <h2 className="font-display text-2xl font-medium leading-none">{section.title}</h2>
            <p className="leading-relaxed text-bark-600">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-10 border-t border-bark-200 pt-6 text-sm text-bark-600">
        <Link href={localePath(locale, "/terms")} className="font-semibold text-brand underline underline-offset-4">
          {t.footer.terms}
        </Link>
        {" · "}
        <Link href={localePath(locale, "/contact")} className="font-semibold text-brand underline underline-offset-4">
          {t.footer.contact}
        </Link>
      </p>
    </div>
  );
}
