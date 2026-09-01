import type { ReactNode } from "react";

import { GlassPanel } from "@/components/glass-panel";
import { CheckIcon, LeafMark, ShieldCheckIcon } from "@/components/ui/icons";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export function AccountShell({
  t,
  title,
  intro,
  children,
}: {
  t: Dictionary;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  const benefits = [
    { icon: ShieldCheckIcon, text: t.account.authBenefit1 },
    { icon: LeafMark, text: t.account.authBenefit2 },
    { icon: CheckIcon, text: t.account.authBenefit3 },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid overflow-hidden rounded-[2rem] border border-white/70 bg-white/40 shadow-glass backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative order-last overflow-hidden bg-bark-900 p-7 text-white sm:p-10 lg:order-first">
          <div aria-hidden className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-marigold-400/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-leaf-400/20 blur-3xl" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-marigold-100 ring-1 ring-inset ring-white/20">
              <ShieldCheckIcon /> {t.account.authEyebrow}
            </p>
            <h2 className="mt-5 font-display text-3xl leading-tight text-white sm:text-4xl">
              Organics
            </h2>
            <ul className="mt-8 grid gap-5">
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3 text-sm leading-relaxed text-bark-100 sm:text-base">
                  <Icon className="mt-1 shrink-0 text-marigold-400" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <GlassPanel className="order-first rounded-none border-0 p-7 shadow-none sm:p-10 lg:order-last">
          <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-lg leading-relaxed text-bark-600">{intro}</p>
          {children}
        </GlassPanel>
      </div>
    </div>
  );
}
