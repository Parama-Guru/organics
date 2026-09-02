import Link from "next/link";

import { StoreApplicationForm } from "@/components/store-application-form";
import { FarmerApplicationForm } from "@/components/farmer-application-form";
import { showFarmerPhone } from "@/components/farmer-contact";
import { PhoneSoonNotice } from "@/components/phone-soon-notice";
import { localePath } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.meta.sellTitle, description: t.meta.sellDescription };
}

export default async function SellPage({ searchParams }: PageProps<"/[lang]/sell">) {
  const [t, locale, params] = await Promise.all([getDictionary(), getLocale(), searchParams]);
  const requested = Array.isArray(params.type) ? params.type[0] : params.type;
  const isStore = requested === "store";

  // This page recruits farmers on the promise that buyers will ring them. While
  // numbers are withheld that promise has a caveat, and the farmer is the person
  // who most deserves to hear it before applying.
  const phoneShown = showFarmerPhone();

  const steps = isStore
    ? [
        { title: t.storeApplication.step1Title, body: t.storeApplication.step1Body },
        { title: t.storeApplication.step2Title, body: t.storeApplication.step2Body },
        { title: t.storeApplication.step3Title, body: t.storeApplication.step3Body },
      ]
    : [
        { title: t.sell.step1Title, body: t.sell.step1Body },
        { title: t.sell.step2Title, body: t.sell.step2Body },
        { title: t.sell.step3Title, body: phoneShown ? t.sell.step3Body : t.sell.step3BodySoon },
      ];

  // Links rather than client state: the choice survives a reload, can be shared,
  // and works before the page has hydrated.
  const options = [
    {
      key: "farm",
      href: localePath(locale, "/sell"),
      label: t.sell.chooseFarm,
      hint: t.sell.chooseFarmHint,
      active: !isStore,
    },
    {
      key: "store",
      href: `${localePath(locale, "/sell")}?type=store`,
      label: t.sell.chooseStore,
      hint: t.sell.chooseStoreHint,
      active: isStore,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <header className="border-b border-bark-200 pb-10 sm:pb-14">
        <p className="section-kicker">{isStore ? t.storeApplication.badge : t.sell.badge}</p>
        <h1 className="editorial-heading mt-6 max-w-5xl">
          {isStore ? t.storeApplication.titleLead : t.sell.titleLead}
          <span className="text-marigold-600">
            {isStore ? t.storeApplication.titleAccent : t.sell.titleAccent}
          </span>
          {isStore ? t.storeApplication.titleTail : t.sell.titleTail}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bark-600 sm:text-xl">
          {isStore ? t.storeApplication.intro : phoneShown ? t.sell.intro : t.sell.introSoon}
        </p>

        {isStore ? null : <PhoneSoonNotice className="mt-4 max-w-2xl" />}
      </header>

      <fieldset className="mt-10">
        <legend className="rule-label text-bark-600">{t.sell.chooseLabel}</legend>
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <Link
              key={option.key}
              href={option.href}
              aria-current={option.active ? "true" : undefined}
              className={`card-lift group flex min-w-0 items-start gap-3 rounded-[1.25rem] border p-5 transition-colors ${
                option.active
                  ? "border-marigold-500 bg-marigold-50 ring-1 ring-marigold-500"
                  : "border-bark-200 bg-paper hover:border-marigold-400"
              }`}
            >
              <span
                aria-hidden
                className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                  option.active ? "border-marigold-600" : "border-bark-200"
                }`}
              >
                {option.active ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-marigold-600" />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-xl text-bark-900">{option.label}</span>
                <span className="mt-1 block text-sm leading-relaxed text-bark-600">
                  {option.hint}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </fieldset>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-[2rem] bg-inverse p-6 text-white lg:sticky lg:top-28 lg:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-marigold-400">
            {isStore ? t.storeApplication.fieldGuide : t.sell.fieldGuide}
          </p>
          <ol className="mt-5 border-t border-white/15">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 border-b border-white/15 py-5"
              >
                <span aria-hidden className="font-mono text-xs text-marigold-400">
                  0{index + 1}
                </span>
                <span>
                  <h2 className="font-display text-xl text-white">{step.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-bark-100">{step.body}</p>
                </span>
              </li>
            ))}
          </ol>
        </aside>

        <section>
          <p className="section-kicker">
            {isStore ? t.storeApplication.storeRecord : t.sell.farmRecord}
          </p>
          <h2 className="mt-5 font-display text-4xl font-medium sm:text-5xl">
            {isStore ? t.storeApplication.applyHeading : t.sell.applyHeading}
          </h2>
          {isStore ? <StoreApplicationForm /> : <FarmerApplicationForm />}
        </section>
      </div>
    </div>
  );
}
