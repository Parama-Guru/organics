import type { Metadata } from "next";
import { Manrope, Noto_Sans_Tamil } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FARMER_PORTAL, farmerPortalEnabled, getFarmer } from "@/lib/farmer-auth";
import { SignOutButton } from "@/app/pannai/sign-out-button";

import "../globals.css";

const body = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-body-family" });
const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  display: "swap",
  variable: "--font-body-tamil",
});

export const metadata: Metadata = {
  title: "பண்ணை நிர்வாகம்",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The farmer's own area. Outside /[lang] like the staff tree: it is a tool, not
 * part of the shop, and it is Tamil-only because its users are.
 */
export default async function FarmerLayout({ children }: LayoutProps<"/pannai">) {
  if (!farmerPortalEnabled()) notFound();

  const farmer = await getFarmer();

  return (
    <html lang="ta-IN" className={`${body.variable} ${tamil.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bark-50">
        <header className="border-b border-bark-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
            <Link href={FARMER_PORTAL} className="font-display text-lg text-bark-900">
              Organics <span className="text-bark-600">பண்ணை</span>
            </Link>
            {farmer ? (
              <nav aria-label="பண்ணை" className="ml-auto flex items-center gap-4 text-sm">
                <span className="hidden text-bark-600 sm:inline">{farmer.farmName}</span>
                <Link
                  href={FARMER_PORTAL}
                  className="flex min-h-11 items-center text-bark-600 hover:text-bark-900"
                >
                  பொருட்கள்
                </Link>
                <Link
                  href={`${FARMER_PORTAL}/products/new`}
                  className="flex min-h-11 items-center text-bark-600 hover:text-bark-900"
                >
                  புதிது சேர்க்க
                </Link>
                <SignOutButton />
              </nav>
            ) : null}
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
