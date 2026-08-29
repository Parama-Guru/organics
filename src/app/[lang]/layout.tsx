import type { Metadata } from "next";
import { Fraunces, Manrope, Noto_Sans_Tamil, Noto_Serif_Tamil } from "next/font/google";

import { loadConfig } from "@conf/config";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { I18nProvider } from "@/lib/i18n/client";
import { HTML_LANG, LOCALES } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

import "../globals.css";

// next/font self-hosts these at build time, so the CSP stays `font-src 'self'`.
const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-family",
  axes: ["SOFT", "WONK"],
});

const body = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body-family",
});

// Fraunces and Manrope carry no Tamil glyphs. These sit next in the stack, so the
// browser resolves per glyph: Latin stays Fraunces/Manrope, Tamil falls through here.
const displayTamil = Noto_Serif_Tamil({
  subsets: ["tamil"],
  display: "swap",
  variable: "--font-display-tamil",
});

const bodyTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  display: "swap",
  variable: "--font-body-tamil",
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { app } = loadConfig();
  const locale = await getLocale();
  const t = await getDictionary();

  return {
    metadataBase: new URL(app.site_url),
    title: {
      default: `${app.name} — ${t.meta.title}`,
      template: `%s | ${app.name}`,
    },
    description: t.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(LOCALES.map((code) => [HTML_LANG[code], `/${code}`])),
    },
    openGraph: {
      title: `${app.name} — ${t.meta.title}`,
      description: t.meta.description,
      url: `${app.site_url}/${locale}`,
      siteName: app.name,
      locale: HTML_LANG[locale].replace("-", "_"),
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <html
      lang={HTML_LANG[locale]}
      className={`${display.variable} ${body.variable} ${displayTamil.variable} ${bodyTamil.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale} t={t}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-leaf-700 focus:px-4 focus:py-2 focus:text-white"
          >
            {t.nav.skipToContent}
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
