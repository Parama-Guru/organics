import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Instrument_Serif, Noto_Sans_Tamil, Noto_Serif_Tamil } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StoreSignOutButton } from "@/app/kadai/sign-out-button";
import { THEME_SCRIPT } from "@/lib/theme";
import { getStoredTheme } from "@/lib/theme-cookie";
import { STORE_PORTAL, getStore, storePortalEnabled } from "@/lib/store-auth";

import "../globals.css";

const body = DM_Sans({ subsets: ["latin"], display: "swap", variable: "--font-body-family" });
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-display-family" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--font-mono-family" });
const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  display: "swap",
  variable: "--font-body-tamil",
});
const tamilDisplay = Noto_Serif_Tamil({ subsets: ["tamil"], display: "swap", variable: "--font-display-tamil" });

export const metadata: Metadata = {
  title: "கடை நிர்வாகம்",
  robots: { index: false, follow: false, nocache: true },
};

/** Store-owner operations are Tamil-first and deliberately outside /[lang]. */
export default async function StoreLayout({ children }: LayoutProps<"/kadai">) {
  if (!storePortalEnabled()) notFound();
  const store = await getStore();
  const theme = await getStoredTheme();

  return (
    <html lang="ta-IN" data-theme={theme ?? undefined} suppressHydrationWarning className={`${body.variable} ${display.variable} ${mono.variable} ${tamil.variable} ${tamilDisplay.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="portal-shell min-h-full bg-canvas">
        <div className="flex min-h-screen">
          <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col bg-inverse p-7 text-white lg:flex">
            <Link href={STORE_PORTAL} className="font-display text-3xl font-medium text-white">OSSIL</Link>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-marigold-400">கடை workspace</p>
            {store ? (
              <>
                <div className="mt-10 border-y border-white/15 py-5">
                  <p className="text-sm text-bark-100">Signed in store</p>
                  <p className="mt-1 font-display text-2xl text-white">{store.storeName}</p>
                </div>
                <nav aria-label="கடை" className="mt-7 grid gap-1 text-sm">
                  <Link href={STORE_PORTAL} className="flex min-h-12 items-center rounded-xl px-3 text-bark-100 hover:bg-white/10 hover:text-white">முகப்பு</Link>
                  <Link href={`${STORE_PORTAL}/profile`} className="flex min-h-12 items-center rounded-xl px-3 text-bark-100 hover:bg-white/10 hover:text-white">விவரங்கள்</Link>
                  <Link href={`${STORE_PORTAL}/enquiries`} className="flex min-h-12 items-center rounded-xl px-3 text-bark-100 hover:bg-white/10 hover:text-white">விசாரணைகள்</Link>
                </nav>
                <div className="mt-auto border-t border-white/15 pt-5"><StoreSignOutButton dark /></div>
              </>
            ) : (
              <p className="mt-auto text-sm leading-relaxed text-bark-100">சரிபார்த்த இயற்கைக் கடைகளுக்கான தனிப்பட்ட நிர்வாக இடம்.</p>
            )}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="border-b border-bark-200 bg-paper lg:hidden">
              <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                <Link href={STORE_PORTAL} className="font-display text-xl text-bark-900">OSSIL <span className="text-bark-600">கடை</span></Link>
                {store ? (
                  <nav aria-label="கடை" className="no-scrollbar ml-auto flex max-w-full items-center gap-1 overflow-x-auto text-sm">
                    <Link href={STORE_PORTAL} className="flex min-h-11 items-center rounded-xl px-2 text-bark-600">முகப்பு</Link>
                    <Link href={`${STORE_PORTAL}/profile`} className="flex min-h-11 items-center rounded-xl px-2 text-bark-600">விவரங்கள்</Link>
                    <Link href={`${STORE_PORTAL}/enquiries`} className="flex min-h-11 items-center rounded-xl px-2 text-bark-600">விசாரணைகள்</Link>
                    <StoreSignOutButton />
                  </nav>
                ) : null}
              </div>
            </header>
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-7 lg:px-10 lg:py-12">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
