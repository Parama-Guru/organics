import Link from "next/link";

import { loadConfig } from "@conf/config";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.meta.careersTitle, description: t.meta.careersDescription };
}

export default async function CareersPage() {
  const [locale, t] = await Promise.all([getLocale(), getDictionary()]);
  const { app } = loadConfig();

  const values = [
    { title: t.careers.value1Title, body: t.careers.value1Body },
    { title: t.careers.value2Title, body: t.careers.value2Body },
    { title: t.careers.value3Title, body: t.careers.value3Body },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <header className="border-b border-bark-200 pb-10 sm:pb-14">
      <p className="section-kicker">{t.careers.badge}</p>
      <h1 className="editorial-heading mt-6 max-w-5xl">
        {t.careers.titleLead}
        <span className="text-marigold-600">{t.careers.titleAccent}</span>
        {t.careers.titleTail}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bark-600 sm:text-xl">{t.careers.intro}</p>
      </header>

      <h2 className="mt-14 font-display text-4xl font-medium sm:text-5xl">
        {t.careers.valuesHeading}
      </h2>
      <ul className="mt-8 border-t border-bark-200">
        {values.map((value, index) => (
          <li
            key={value.title}
            className="grid gap-4 border-b border-bark-200 py-7 sm:grid-cols-[4rem_0.8fr_1.2fr] sm:py-9"
          >
            <span className="font-mono text-xs text-leaf-700">0{index + 1}</span>
            <h3 className="font-display text-2xl">{value.title}</h3>
            <p className="leading-relaxed text-bark-600">{value.body}</p>
          </li>
        ))}
      </ul>

      {/* No invented vacancies. When there is a real one it goes here; until
          then the page says so plainly rather than listing a role nobody is
          hiring for. */}
      <div className="mt-16 rounded-[2rem] bg-inverse p-7 text-white sm:p-10 lg:p-14">
        <p className="section-kicker section-kicker--dark">{t.careers.rolesHeading}</p>
        <p className="mt-5 font-display text-4xl text-white sm:text-5xl">{t.careers.noRoles}</p>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-bark-100">{t.careers.noRolesBody}</p>
      </div>

      <aside className="mt-10 rounded-3xl border border-leaf-200 bg-leaf-50/70 p-8">
        <h2 className="font-display text-2xl">{t.careers.generalHeading}</h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-ink">{t.careers.generalBody}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button as={Link} href={localePath(locale, "/contact")}>
            {t.careers.contactCta}
            <ArrowRightIcon />
          </Button>
          {app.contact_email ? (
            <Button as="a" href={`mailto:${app.contact_email}`} variant="secondary">
              {app.contact_email}
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
