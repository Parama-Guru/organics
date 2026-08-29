import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";

import { loadConfig } from "@conf/config";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

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

export function generateMetadata(): Metadata {
  const { app } = loadConfig();

  return {
    metadataBase: new URL(app.site_url),
    title: {
      default: `${app.name} — Certified organic produce, straight from the farm`,
      template: `%s | ${app.name}`,
    },
    description:
      "Browse certified organic produce and contact the farm directly. Every farmer is verified before their produce is listed.",
    openGraph: {
      title: `${app.name} — Certified organic produce, straight from the farm`,
      description:
        "Browse certified organic produce and call the farmer directly. Every farm is verified before listing.",
      url: app.site_url,
      siteName: app.name,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-leaf-700 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
