import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Newsreader, Noto_Sans_Tamil, Noto_Serif_Tamil } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FARMER_PORTAL, farmerPortalEnabled, getFarmer } from "@/lib/farmer-auth";
import { SignOutButton } from "@/app/pannai/sign-out-button";

import "../globals.css";

const body = DM_Sans({ subsets: ["latin"], display: "swap", variable: "--font-body-family" });
const display = Newsreader({ subsets: ["latin"], display: "swap", variable: "--font-display-family" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", variable: "--font-mono-family" });
const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  display: "swap",
  variable: "--font-body-tamil",
});
const tamilDisplay = Noto_Serif_Tamil({ subsets: ["tamil"], display: "swap", variable: "--font-display-tamil" });

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
    <html lang="ta-IN" className={`${body.variable} ${display.variable} ${mono.variable} ${tamil.variable} ${tamilDisplay.variable} h-full antialiased`}>
      <body className="portal-shell min-h-full bg-bark-50">
        <div className="flex min-h-screen">
          <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col bg-bark-900 p-7 text-white lg:flex">
            <Link href={FARMER_PORTAL} className="font-display text-3xl font-medium text-white">
              Organics
            </Link>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-marigold-400">பண்ணை workspace</p>
            {farmer ? (
              <>
                <div className="mt-10 border-y border-white/15 py-5">
                  <p className="text-sm text-bark-100">Signed in farm</p>
                  <p className="mt-1 font-display text-2xl text-white">{farmer.farmName}</p>
                </div>
                <nav aria-label="பண்ணை" className="mt-7 grid gap-1 text-sm">
                  <Link href={FARMER_PORTAL} className="flex min-h-12 items-center rounded-xl px-3 text-bark-100 hover:bg-white/10 hover:text-white">பொருட்கள்</Link>
                  <Link href={`${FARMER_PORTAL}/products/new`} className="flex min-h-12 items-center rounded-xl px-3 text-bark-100 hover:bg-white/10 hover:text-white">புதிது சேர்க்க</Link>
                  <Link href={`${FARMER_PORTAL}/enquiries`} className="flex min-h-12 items-center rounded-xl px-3 text-bark-100 hover:bg-white/10 hover:text-white">விசாரணைகள்</Link>
                </nav>
                <div className="mt-auto border-t border-white/15 pt-5"><SignOutButton dark /></div>
              </>
            ) : (
              <p className="mt-auto text-sm leading-relaxed text-bark-100">சரிபார்த்த பண்ணைகளுக்கான தனிப்பட்ட நிர்வாக இடம்.</p>
            )}
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="border-b border-bark-200 bg-paper lg:hidden">
              <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                <Link href={FARMER_PORTAL} className="font-display text-xl text-bark-900">Organics <span className="text-bark-600">பண்ணை</span></Link>
                {farmer ? (
                  <nav aria-label="பண்ணை" className="no-scrollbar ml-auto flex max-w-full items-center gap-1 overflow-x-auto text-sm">
                    <Link href={FARMER_PORTAL} className="flex min-h-11 items-center rounded-xl px-2 text-bark-600">பொருட்கள்</Link>
                    <Link href={`${FARMER_PORTAL}/products/new`} className="flex min-h-11 items-center rounded-xl px-2 text-bark-600">புதிது</Link>
                    <Link href={`${FARMER_PORTAL}/enquiries`} className="flex min-h-11 items-center rounded-xl px-2 text-bark-600">விசாரணைகள்</Link>
                    <SignOutButton />
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
