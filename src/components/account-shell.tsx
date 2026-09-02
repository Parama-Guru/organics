import type { ReactNode } from "react";

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
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
      <div className="editorial-panel grid overflow-hidden rounded-[2rem] lg:grid-cols-[0.9fr_1.1fr] lg:rounded-[3rem]">
        <aside className="auth-landscape relative order-last min-h-[28rem] overflow-hidden bg-inverse p-7 text-white sm:p-10 lg:order-first lg:min-h-[42rem] lg:p-12">
          <div aria-hidden className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-marigold-400/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-leaf-400/20 blur-3xl" />
          <div className="relative z-10 flex h-full flex-col">
            <p className="section-kicker section-kicker--dark">
              <ShieldCheckIcon /> {t.account.authEyebrow}
            </p>
            <h2 className="mt-8 font-display text-6xl font-medium leading-[0.85] text-white sm:text-7xl lg:text-8xl">
              OSSIL
            </h2>
            <ul className="mt-auto border-t border-white/15 pt-4">
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3 border-b border-white/15 py-4 text-sm leading-relaxed text-bark-100 sm:text-base">
                  <Icon className="mt-1 shrink-0 text-marigold-400" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="order-first bg-paper p-7 sm:p-10 lg:order-last lg:p-14">
          <p className="section-kicker">Private member notebook</p>
          <h1 className="mt-6 font-display text-4xl font-medium leading-none sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-bark-600">{intro}</p>
          {children}
        </section>
      </div>
    </div>
  );
}
