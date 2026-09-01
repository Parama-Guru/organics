import Link from "next/link";

import { loadConfig } from "@conf/config";
import { showFarmerPhone } from "@/components/farmer-contact";
import { LeafMark, MapPinIcon } from "@/components/ui/icons";
import { format, localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export async function SiteFooter() {
  const locale = await getLocale();
  const t = await getDictionary();
  const { app } = loadConfig();

  const browse = [
    { href: "/products", label: t.nav.shop },
    { href: "/farmers", label: t.nav.farmers },
    { href: "/sell", label: t.nav.sell },
  ];

  return (
    <footer className="mt-16 border-t border-white/60 bg-white/55 backdrop-blur-xl sm:mt-20">
      {/* The two link lists sit side by side on a phone. Stacked, with 44px tap
          targets on every row, the footer alone ran to 742px. */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] md:py-12">
        <div className="col-span-2 md:col-span-1">
          <p className="flex items-center gap-2 font-display text-lg">
            <LeafMark className="text-2xl text-leaf-600" /> Organics
          </p>
        <p className="mt-3 max-w-sm leading-relaxed text-bark-600">
          {showFarmerPhone() ? t.footer.blurb : t.footer.blurbSoon}
        </p>
          {app.contact_place ? (
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-bark-600">
              <MapPinIcon /> {app.contact_place}
            </p>
          ) : null}
        </div>

        <nav aria-label={t.footer.browseHeading}>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-bark-900">
            {t.footer.browseHeading}
          </h2>
          <ul className="mt-3 space-y-1 text-sm">
            {browse.map((item) => (
              <li key={item.href}>
                <Link
                  href={localePath(locale, item.href)}
                  className="inline-flex min-h-10 items-center text-bark-600 underline-offset-4 transition-colors hover:text-bark-900 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-bark-900">
            {t.footer.trustHeading}
          </h2>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <Link
                href={localePath(locale, "/how-we-check")}
                className="inline-flex min-h-10 items-center text-bark-600 underline-offset-4 transition-colors hover:text-bark-900 hover:underline"
              >
                {t.footer.howWeCheck}
              </Link>
            </li>
            <li>
              <Link
                href={localePath(locale, "/privacy")}
                className="inline-flex min-h-10 items-center text-bark-600 underline-offset-4 transition-colors hover:text-bark-900 hover:underline"
              >
                {t.footer.privacy}
              </Link>
            </li>
            {app.contact_email ? (
              <li>
                <a
                  href={`mailto:${app.contact_email}`}
                  className="inline-flex min-h-10 items-center break-all text-bark-600 underline-offset-4 transition-colors hover:text-bark-900 hover:underline"
                >
                  {app.contact_email}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-6xl border-t border-bark-200/50 px-4 py-5 text-sm text-bark-600 sm:px-6">
        {format(t.footer.copyright, { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
