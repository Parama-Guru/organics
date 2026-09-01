import Link from "next/link";

import { loadConfig } from "@conf/config";
import { ContactForm } from "@/components/contact-form";
import { Badge } from "@/components/ui/badge";
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
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Badge tone="marigold">{t.contactPage.badge}</Badge>
      <h1 className="mt-4 font-display text-4xl sm:text-5xl">{t.contactPage.heading}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink">{t.contactPage.intro}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
        <ContactForm initialRole={initialRole} />

        <aside className="rounded-3xl border border-leaf-200 bg-leaf-50/70 p-6 lg:mt-8">
          <h2 className="font-display text-lg">{t.contactPage.reachHeading}</h2>
          <dl className="mt-4 space-y-4 text-sm">
            {app.contact_email ? (
              <div>
                <dt className="font-semibold text-bark-900">{t.contactPage.emailLabel}</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${app.contact_email}`}
                    className="break-all text-bark-600 underline-offset-4 hover:text-bark-900 hover:underline"
                  >
                    {app.contact_email}
                  </a>
                </dd>
              </div>
            ) : null}
            {app.contact_phone ? (
              <div>
                <dt className="font-semibold text-bark-900">{t.contactPage.phoneLabel}</dt>
                <dd className="mt-0.5">
                  <a
                    href={`tel:${app.contact_phone.replace(/[^+0-9]/g, "")}`}
                    className="inline-flex items-center gap-1.5 text-bark-600 underline-offset-4 hover:text-bark-900 hover:underline"
                  >
                    <PhoneIcon /> {app.contact_phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {app.contact_address || app.contact_place ? (
              <div>
                <dt className="font-semibold text-bark-900">{t.contactPage.addressLabel}</dt>
                <dd className="mt-0.5 inline-flex items-start gap-1.5 leading-relaxed text-bark-600">
                  <MapPinIcon className="mt-1 shrink-0" />
                  <span>{app.contact_address || app.contact_place}</span>
                </dd>
              </div>
            ) : null}
            {app.contact_hours ? (
              <div>
                <dt className="font-semibold text-bark-900">{t.contactPage.hoursLabel}</dt>
                <dd className="mt-0.5 text-bark-600">{app.contact_hours}</dd>
              </div>
            ) : null}
          </dl>

          <ul className="mt-6 space-y-3 border-t border-leaf-200 pt-5 text-sm">
            {shortcuts.map((shortcut) => (
              <li key={shortcut.href}>
                <p className="text-bark-600">{shortcut.label}</p>
                <Link
                  href={localePath(locale, shortcut.href)}
                  className="mt-0.5 inline-flex items-center gap-1.5 font-semibold text-brand underline-offset-4 hover:underline"
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
