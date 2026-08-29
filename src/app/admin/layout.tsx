import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SignOutButton } from "@/app/admin/sign-out-button";
import { isAdminEnabled, isSignedIn } from "@/lib/admin-auth";

import "../globals.css";

const body = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-body-family" });

// Staff-only: keep it out of search results and out of any share preview.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

// Deliberately outside /[lang]: this is an internal tool, not part of the
// customer site, so it carries no locale segment and never appears in the nav.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // With no passphrase configured the whole area behaves as if it does not exist.
  if (!isAdminEnabled()) notFound();

  const signedIn = await isSignedIn();

  return (
    <html lang="en" className={`${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bark-50">
        <header className="border-b border-bark-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
            <Link href="/admin" className="font-display text-lg text-bark-900">
              Organics <span className="text-bark-600">admin</span>
            </Link>
            {signedIn ? (
              <nav aria-label="Admin" className="ml-auto flex items-center gap-4 text-sm">
                <Link href="/admin" className="text-bark-600 hover:text-bark-900">
                  Applications
                </Link>
                <Link href="/admin/farmers/new" className="text-bark-600 hover:text-bark-900">
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
