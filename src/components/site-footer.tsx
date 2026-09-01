import Link from "next/link";

import { loadConfig } from "@conf/config";
import { showFarmerPhone } from "@/components/farmer-contact";
import {
  FacebookIcon,
  InstagramIcon,
  LeafMark,
  LinkedInIcon,
  MapPinIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/components/ui/icons";
import { format, localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export async function SiteFooter() {
  const locale = await getLocale();
  const t = await getDictionary();
  const { app, social } = loadConfig();

  const browse = [
    { href: "/products", label: t.nav.shop },
    { href: "/farmers", label: t.nav.farmers },
    { href: "/stores", label: t.nav.stores },
  ];

  const company = [
    { href: "/contact", label: t.footer.contact },
    { href: "/careers", label: t.footer.careers },
    { href: "/sell", label: t.nav.sell },
    { href: "/stores/register", label: t.footer.joinAsStore },
  ];

  // Every account is being opened as the site launches. Each icon is a real
  // link once its URL is configured and a dimmed, unclickable one until then:
  // an icon that quietly appears on the day the handle is created is easy to
  // miss, whereas a greyed-out row is a standing reminder of what is left.
  const socials = [
    { name: "Instagram", href: social.instagram, Icon: InstagramIcon },
    { name: "Facebook", href: social.facebook, Icon: FacebookIcon },
    { name: "LinkedIn", href: social.linkedin, Icon: LinkedInIcon },
    { name: "YouTube", href: social.youtube, Icon: YouTubeIcon },
    { name: "WhatsApp", href: social.whatsapp, Icon: WhatsAppIcon },
  ];

  const linkClass =
    "inline-flex min-h-10 items-center text-bark-600 underline-offset-4 transition-colors hover:text-bark-900 hover:underline";

  return (
    <footer className="mt-16 border-t border-white/60 bg-white/55 backdrop-blur-xl sm:mt-20">
      {/* The link lists sit two-up on a phone. Stacked, with 44px tap targets on
          every row, the footer alone ran to 742px. */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-12">
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

          <h2 className="mt-6 font-display text-sm font-semibold uppercase tracking-wide text-bark-900">
            {t.footer.followHeading}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-1">
            {socials.map(({ name, href, Icon }) => (
              <li key={name}>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="me noreferrer"
                    aria-label={name}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-xl text-bark-600 transition-colors hover:bg-white/70 hover:text-bark-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-400"
                  >
                    <Icon />
                  </a>
                ) : (
                  // Not a link and not a button: there is nothing to open yet.
                  // role="img" with one label is what keeps a screen reader from
                  // announcing the name and the same text again as content.
                  <span
                    role="img"
                    aria-label={format(t.footer.soon, { network: name })}
                    title={format(t.footer.soon, { network: name })}
                    className="inline-flex h-11 w-11 cursor-default items-center justify-center rounded-xl text-xl text-bark-600/35"
                  >
                    <Icon />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label={t.footer.browseHeading}>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-bark-900">
            {t.footer.browseHeading}
          </h2>
          <ul className="mt-3 space-y-1 text-sm">
            {browse.map((item) => (
              <li key={item.href}>
                <Link href={localePath(locale, item.href)} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t.footer.companyHeading}>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-bark-900">
            {t.footer.companyHeading}
          </h2>
          <ul className="mt-3 space-y-1 text-sm">
            {company.map((item) => (
              <li key={item.href}>
                <Link href={localePath(locale, item.href)} className={linkClass}>
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
              <Link href={localePath(locale, "/how-we-check")} className={linkClass}>
                {t.footer.howWeCheck}
              </Link>
            </li>
            <li>
              <Link href={localePath(locale, "/privacy")} className={linkClass}>
                {t.footer.privacy}
              </Link>
            </li>
            {app.contact_email ? (
              <li>
                <a href={`mailto:${app.contact_email}`} className={`${linkClass} break-all`}>
                  {app.contact_email}
                </a>
              </li>
            ) : null}
            {app.contact_phone ? (
              <li>
                <a href={`tel:${app.contact_phone.replace(/[^+0-9]/g, "")}`} className={linkClass}>
                  {app.contact_phone}
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
