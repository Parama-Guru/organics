import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Instrument_Serif } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SignOutButton } from "@/app/tj/sign-out-button";
import { isAdminEnabled, isSignedIn } from "@/lib/admin-auth";
import { THEME_SCRIPT } from "@/lib/theme";
import { getStoredTheme } from "@/lib/theme-cookie";

import "../globals.css";

const body = DM_Sans({ subsets: ["latin"], display: "swap", variable: "--font-body-family" });
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-display-family" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--font-mono-family" });

// Staff-only: keep it out of search results and out of any share preview. The
// title is deliberately bland — "Admin" in a shared browser's history advertises
// exactly what the unguessable path was meant to hide.
export const metadata: Metadata = {
  title: "OSSIL",
  robots: { index: false, follow: false, nocache: true },
};

// Deliberately outside /[lang]: this is an internal tool, not part of the
// customer site, so it carries no locale segment and never appears in the nav.
export default async function AdminLayout({ children }: LayoutProps<"/tj">) {
  // With no passphrase configured the whole area behaves as if it does not exist.
  if (!isAdminEnabled()) notFound();

  const signedIn = await isSignedIn();
  const theme = await getStoredTheme();
  const navigation = [
    ["/tj/overview", "Overview"],
    ["/tj", "Farm reviews"],
    ["/tj/listings", "Listings"],
    ["/tj/stores", "Store reviews"],
    ["/tj/buyers", "Buyers"],
    ["/tj/messages", "Messages"],
    ["/tj/enquiries", "Enquiries"],
    ["/tj/sponsored", "Sponsored"],
    ["/tj/export", "Export"],
    ["/tj/farmers/new", "Add a farm"],
  ] as const;

  return (
    <html lang="en" data-theme={theme ?? undefined} suppressHydrationWarning className={`${body.variable} ${display.variable} ${mono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="portal-shell min-h-full bg-canvas">
        <div className="flex min-h-screen">
          <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col bg-inverse p-7 text-white lg:flex">
            <Link href="/tj" className="font-display text-3xl font-medium text-white">OSSIL</Link>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-marigold-400">Staff command centre</p>
            {signedIn ? (
              <>
                <nav aria-label="Admin" className="mt-9 grid gap-1 text-sm">
                  {navigation.map(([href, label], index) => (
                    <Link key={href} href={href} className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-bark-100 transition-colors hover:bg-white/10 hover:text-white">
                      <span className="font-mono text-[0.65rem] text-marigold-400/70">{String(index + 1).padStart(2, "0")}</span>
                      {label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto border-t border-white/15 pt-5"><SignOutButton dark /></div>
              </>
            ) : (
              <p className="mt-auto text-sm leading-relaxed text-bark-100">Private verification and operations workspace.</p>
            )}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="border-b border-bark-200 bg-paper lg:hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <Link href="/tj" className="shrink-0 font-display text-xl text-bark-900">OSSIL <span className="text-bark-600">staff</span></Link>
                {signedIn ? <SignOutButton /> : null}
              </div>
              {signedIn ? (
                <nav aria-label="Admin" className="no-scrollbar flex overflow-x-auto border-t border-bark-200 px-2 text-sm">
                  {navigation.map(([href, label]) => (
                    <Link key={href} href={href} className="flex min-h-11 shrink-0 items-center rounded-xl px-3 text-bark-600">{label}</Link>
                  ))}
                </nav>
              ) : null}
            </header>
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-7 lg:px-10 lg:py-12">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
