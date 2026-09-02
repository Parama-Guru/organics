import Link from "next/link";

import { loadConfig } from "@conf/config";
import { ContactForm } from "@/components/contact-form";
import { ArrowRightIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.meta.contactTitle, description: t.meta.contactDescription };
}

export default async function ContactPage({ searchParams }: PageProps<"/[lang]/contact">) {
  const [params, locale, t] = await Promise.all([searchParams, getLocale(), getDictionary()]);
  const { app } = loadConfig();

  // Linked from the farmer and store pages as ?as=FARMER, so someone arriving
  // from there does not have to answer a question they have already answered.
  const initialRole = Array.isArray(params.as) ? params.as[0] : params.as;

  const shortcuts = [
    {
      label: t.contactPage.farmerShortcut,
      link: t.contactPage.farmerShortcutLink,
      href: "/sell",
    },
    {
      label: t.contactPage.storeShortcut,
      link: t.contactPage.storeShortcutLink,
      href: "/stores/register",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <header className="grid grid-cols-[minmax(0,1fr)] gap-6 border-b border-bark-200 pb-10 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] lg:items-end lg:pb-14">
        <p className="section-kicker">{t.contactPage.badge}</p>
        <div>
          <h1 className="editorial-heading">{t.contactPage.heading}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bark-600 sm:text-xl">{t.contactPage.intro}</p>
        </div>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_21rem] lg:items-start">
        <ContactForm initialRole={initialRole} />

        <aside className="rounded-[2rem] bg-bark-900 p-7 text-white lg:sticky lg:top-28">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-marigold-400">Contact ledger</p>
          <h2 className="mt-4 font-display text-3xl text-white">{t.contactPage.reachHeading}</h2>
          <dl className="mt-4 space-y-4 text-sm">
            {app.contact_email ? (
              <div>
                <dt className="font-semibold text-white">{t.contactPage.emailLabel}</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${app.contact_email}`}
                    className="break-all text-bark-100 underline-offset-4 hover:text-white hover:underline"
                  >
                    {app.contact_email}
                  </a>
                </dd>
              </div>
            ) : null}
            {app.contact_phone ? (
              <div>
                <dt className="font-semibold text-white">{t.contactPage.phoneLabel}</dt>
                <dd className="mt-0.5">
                  <a
                    href={`tel:${app.contact_phone.replace(/[^+0-9]/g, "")}`}
                    className="inline-flex items-center gap-1.5 text-bark-100 underline-offset-4 hover:text-white hover:underline"
                  >
                    <PhoneIcon /> {app.contact_phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {app.contact_address || app.contact_place ? (
              <div>
                <dt className="font-semibold text-white">{t.contactPage.addressLabel}</dt>
                <dd className="mt-0.5 inline-flex items-start gap-1.5 leading-relaxed text-bark-100">
                  <MapPinIcon className="mt-1 shrink-0" />
                  <span>{app.contact_address || app.contact_place}</span>
                </dd>
              </div>
            ) : null}
            {app.contact_hours ? (
              <div>
                <dt className="font-semibold text-white">{t.contactPage.hoursLabel}</dt>
                <dd className="mt-0.5 text-bark-100">{app.contact_hours}</dd>
              </div>
            ) : null}
          </dl>

          <ul className="mt-6 space-y-4 border-t border-white/15 pt-5 text-sm">
            {shortcuts.map((shortcut) => (
              <li key={shortcut.href}>
                <p className="text-bark-100">{shortcut.label}</p>
                <Link
                  href={localePath(locale, shortcut.href)}
                  className="mt-0.5 inline-flex items-center gap-1.5 font-semibold text-white underline-offset-4 hover:underline"
                >
                  {shortcut.link} <ArrowRightIcon />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
