import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SignOutButton } from "@/app/tj/sign-out-button";
import { isAdminEnabled, isSignedIn } from "@/lib/admin-auth";

import "../globals.css";

const body = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-body-family" });

// Staff-only: keep it out of search results and out of any share preview. The
// title is deliberately bland — "Admin" in a shared browser's history advertises
// exactly what the unguessable path was meant to hide.
export const metadata: Metadata = {
  title: "Organics",
  robots: { index: false, follow: false, nocache: true },
};

// Deliberately outside /[lang]: this is an internal tool, not part of the
// customer site, so it carries no locale segment and never appears in the nav.
export default async function AdminLayout({ children }: LayoutProps<"/tj">) {
  // With no passphrase configured the whole area behaves as if it does not exist.
  if (!isAdminEnabled()) notFound();

  const signedIn = await isSignedIn();

  return (
    <html lang="en" className={`${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bark-50">
        <header className="border-b border-bark-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
            <Link href="/tj" className="font-display text-lg text-bark-900">
              Organics <span className="text-bark-600">admin</span>
            </Link>
            {signedIn ? (
              <nav
                aria-label="Admin"
                className="ml-auto flex flex-wrap items-center gap-x-1 gap-y-1 text-sm"
              >
                <Link
                  href="/tj/overview"
                  className="inline-flex min-h-11 items-center rounded-lg px-2 text-bark-600 hover:bg-bark-50 hover:text-bark-900"
                >
                  Overview
                </Link>
                <Link
                  href="/tj"
                  className="inline-flex min-h-11 items-center rounded-lg px-2 text-bark-600 hover:bg-bark-50 hover:text-bark-900"
                >
                  Applications
                </Link>
                <Link
                  href="/tj/listings"
                  className="inline-flex min-h-11 items-center rounded-lg px-2 text-bark-600 hover:bg-bark-50 hover:text-bark-900"
                >
                  Listings
                </Link>
                <Link
                  href="/tj/stores"
                  className="inline-flex min-h-11 items-center rounded-lg px-2 text-bark-600 hover:bg-bark-50 hover:text-bark-900"
                >
                  Stores
                </Link>
                <Link
                  href="/tj/buyers"
                  className="inline-flex min-h-11 items-center rounded-lg px-2 text-bark-600 hover:bg-bark-50 hover:text-bark-900"
                >
                  Buyers
                </Link>
                <Link
                  href="/tj/messages"
                  className="inline-flex min-h-11 items-center rounded-lg px-2 text-bark-600 hover:bg-bark-50 hover:text-bark-900"
                >
                  Messages
                </Link>
                <Link
                  href="/tj/export"
                  className="inline-flex min-h-11 items-center rounded-lg px-2 text-bark-600 hover:bg-bark-50 hover:text-bark-900"
                >
                  Export
                </Link>
                <Link
                  href="/tj/farmers/new"
                  className="inline-flex min-h-11 items-center rounded-lg px-2 text-bark-600 hover:bg-bark-50 hover:text-bark-900"
                >
                  Add a farm
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
