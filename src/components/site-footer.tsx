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
    "inline-flex min-h-10 items-center text-bark-100/75 underline-offset-4 transition-colors hover:text-white hover:underline";

  return (
    <footer className="mt-24 px-3 pb-3 sm:mt-36 sm:px-5 sm:pb-5">
      <div className="mx-auto max-w-[90rem] overflow-hidden rounded-[2rem] bg-inverse px-5 pb-6 pt-9 text-white sm:rounded-[3rem] sm:px-10 sm:pb-8 sm:pt-12 lg:px-14">
        <div className="border-b border-white/15 pb-9 sm:pb-12">
          <p className="section-kicker section-kicker--dark">
            {t.footer.trustHeading}
          </p>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.5fr_0.7fr] lg:items-end">
            <p className="font-display text-[clamp(3.8rem,11vw,10rem)] font-medium leading-[0.78] tracking-[-0.05em] text-white">
              OSSIL
            </p>
            <p className="max-w-lg text-base leading-relaxed text-bark-100/80 lg:pb-1 lg:text-lg">
              {showFarmerPhone() ? t.footer.blurb : t.footer.blurbSoon}
            </p>
          </div>
        </div>

        {/* The link lists sit two-up on a phone. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-12">
          <div className="col-span-2 md:col-span-1">
          <p className="flex items-center gap-2 font-display text-2xl text-white">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-marigold-500 text-on-action">
              <LeafMark className="text-2xl" />
            </span>
            {app.name}
          </p>
          <p className="mt-4 max-w-sm leading-relaxed text-bark-100/70">
            {showFarmerPhone() ? t.footer.blurb : t.footer.blurbSoon}
          </p>
          {app.contact_place ? (
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-bark-100/70">
              <MapPinIcon /> {app.contact_place}
            </p>
          ) : null}

          <h2 className="mt-7 font-mono text-xs font-medium uppercase tracking-[0.12em] text-marigold-400">
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
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-xl text-bark-100/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-400"
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
                    className="inline-flex h-11 w-11 cursor-default items-center justify-center rounded-full text-xl text-bark-100/25"
                  >
                    <Icon />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label={t.footer.browseHeading}>
          <h2 className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-marigold-400">
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
          <h2 className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-marigold-400">
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
          <h2 className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-marigold-400">
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-6 text-sm text-bark-100/75">
          <span>{format(t.footer.copyright, { year: new Date().getFullYear() })}</span>
          <span className="font-mono text-xs uppercase tracking-[0.12em]">Tamil Nadu · India</span>
        </div>
      </div>
    </footer>
  );
}
