import Link from "next/link";

import { loadConfig } from "@conf/config";
import { Badge } from "@/components/ui/badge";
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
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Badge tone="marigold">{t.careers.badge}</Badge>
      <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
        {t.careers.titleLead}
        <span className="text-marigold-600">{t.careers.titleAccent}</span>
        {t.careers.titleTail}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-bark-600">{t.careers.intro}</p>

      <h2 className="mt-14 font-display text-2xl sm:text-3xl">
        {t.careers.valuesHeading}
        <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-leaf-500" />
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {values.map((value, index) => (
          <li
            key={value.title}
            style={{ animationDelay: `${index * 80}ms` }}
            className="glass animate-rise rounded-2xl p-5"
          >
            <h3 className="font-display text-lg">{value.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-bark-600">{value.body}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-14 font-display text-2xl sm:text-3xl">
        {t.careers.rolesHeading}
        <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-marigold-500" />
      </h2>

      {/* No invented vacancies. When there is a real one it goes here; until
          then the page says so plainly rather than listing a role nobody is
          hiring for. */}
      <div className="glass mt-6 rounded-3xl p-8">
        <p className="font-display text-xl">{t.careers.noRoles}</p>
        <p className="mt-2 max-w-2xl leading-relaxed text-bark-600">{t.careers.noRolesBody}</p>
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
