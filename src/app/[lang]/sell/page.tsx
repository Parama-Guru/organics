import { FarmerApplicationForm } from "@/components/farmer-application-form";
import { Badge } from "@/components/ui/badge";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.meta.sellTitle, description: t.meta.sellDescription };
}

export default async function SellPage() {
  const t = await getDictionary();

  const steps = [
    { title: t.sell.step1Title, body: t.sell.step1Body },
    { title: t.sell.step2Title, body: t.sell.step2Body },
    { title: t.sell.step3Title, body: t.sell.step3Body },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Badge tone="marigold">{t.sell.badge}</Badge>
      <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
        {t.sell.titleLead}
        <span className="text-marigold-600">{t.sell.titleAccent}</span>
        {t.sell.titleTail}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-bark-600">{t.sell.intro}</p>

      <ol className="mt-10 grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            style={{ animationDelay: `${index * 80}ms` }}
            className="glass animate-rise rounded-2xl p-5"
          >
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full bg-bark-900 font-display text-sm text-marigold-50"
            >
              {index + 1}
            </span>
            <h2 className="mt-3 font-display text-lg">{step.title}</h2>
            <p className="mt-1 text-sm text-bark-600">{step.body}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-14 font-display text-2xl sm:text-3xl">
        {t.sell.applyHeading}
        <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-marigold-500" />
      </h2>
      <FarmerApplicationForm />
    </div>
  );
}
