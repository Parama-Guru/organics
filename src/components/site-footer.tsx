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

  const columnHeading =
    "font-mono text-xs font-medium uppercase tracking-[0.12em] text-marigold-600";

  return (
    // Sits on the page background rather than in its own dark slab: the closing
    // chapter above is already dark, and two stacked blocks read as a wall.
    <footer className="mt-16 border-t border-bark-200 bg-canvas sm:mt-24">
      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <p className="flex items-center gap-2.5 font-display text-2xl text-bark-900">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-marigold-500 text-on-action">
                <LeafMark className="text-xl" />
              </span>
              {app.name}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-bark-600">
              {showFarmerPhone() ? t.footer.blurb : t.footer.blurbSoon}
            </p>
            {app.contact_place ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-bark-600">
                <MapPinIcon /> {app.contact_place}
              </p>
            ) : null}

            <h2 className={`mt-6 ${columnHeading}`}>{t.footer.followHeading}</h2>
            <ul className="mt-1.5 flex flex-wrap gap-0.5">
              {socials.map(({ name, href, Icon }) => (
                <li key={name}>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="me noreferrer"
                      aria-label={name}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-lg text-bark-600 transition-colors hover:bg-canvas-2 hover:text-bark-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-500"
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
                      className="inline-flex h-11 w-11 cursor-default items-center justify-center rounded-full text-lg text-bark-600/35"
                    >
                      <Icon />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label={t.footer.browseHeading}>
            <h2 className={columnHeading}>{t.footer.browseHeading}</h2>
            <ul className="mt-2.5 space-y-0.5 text-sm">
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
            <h2 className={columnHeading}>{t.footer.companyHeading}</h2>
            <ul className="mt-2.5 space-y-0.5 text-sm">
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
            <h2 className={columnHeading}>{t.footer.trustHeading}</h2>
            <ul className="mt-2.5 space-y-0.5 text-sm">
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
              <li>
                <Link href={localePath(locale, "/terms")} className={linkClass}>
                  {t.footer.terms}
                </Link>
              </li>
              <li>
                <Link href={localePath(locale, "/refunds")} className={linkClass}>
                  {t.footer.refunds}
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

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-bark-200 pt-5 text-sm text-bark-600">
          <span>{format(t.footer.copyright, { year: new Date().getFullYear() })}</span>
          <span className="font-mono text-xs uppercase tracking-[0.12em]">Tamil Nadu · India</span>
        </div>
      </div>
    </footer>
  );
}
