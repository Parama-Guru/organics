import { FarmerApplicationForm } from "@/components/farmer-application-form";
import { showFarmerPhone } from "@/components/farmer-contact";
import { PhoneSoonNotice } from "@/components/phone-soon-notice";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.meta.sellTitle, description: t.meta.sellDescription };
}

export default async function SellPage() {
  const t = await getDictionary();
  // This page recruits farmers on the promise that buyers will ring them. While
  // numbers are withheld that promise has a caveat, and the farmer is the person
  // who most deserves to hear it before applying.
  const phoneShown = showFarmerPhone();

  const steps = [
    { title: t.sell.step1Title, body: t.sell.step1Body },
    { title: t.sell.step2Title, body: t.sell.step2Body },
    { title: t.sell.step3Title, body: phoneShown ? t.sell.step3Body : t.sell.step3BodySoon },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <header className="border-b border-bark-200 pb-10 sm:pb-14">
      <p className="section-kicker">{t.sell.badge}</p>
      <h1 className="editorial-heading mt-6 max-w-5xl">
        {t.sell.titleLead}
        <span className="text-marigold-600">{t.sell.titleAccent}</span>
        {t.sell.titleTail}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bark-600 sm:text-xl">
        {phoneShown ? t.sell.intro : t.sell.introSoon}
      </p>

      <PhoneSoonNotice className="mt-4 max-w-2xl" />
      </header>

      <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
      <aside className="rounded-[2rem] bg-inverse p-6 text-white lg:sticky lg:top-28 lg:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-marigold-400">Application field guide</p>
      <ol className="mt-5 border-t border-white/15">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 border-b border-white/15 py-5"
          >
            <span
              aria-hidden
              className="font-mono text-xs text-marigold-400"
            >
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
      <p className="section-kicker">Your farm record</p>
      <h2 className="mt-5 font-display text-4xl font-medium sm:text-5xl">
        {t.sell.applyHeading}
      </h2>
      <FarmerApplicationForm />
      </section>
      </div>
    </div>
  );
}
