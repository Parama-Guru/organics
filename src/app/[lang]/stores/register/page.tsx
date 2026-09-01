import { StoreApplicationForm } from "@/components/store-application-form";
import { Badge } from "@/components/ui/badge";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.meta.storeRegisterTitle, description: t.meta.storeRegisterDescription };
}

export default async function StoreRegisterPage() {
  const t = await getDictionary();

  const steps = [
    { title: t.storeApplication.step1Title, body: t.storeApplication.step1Body },
    { title: t.storeApplication.step2Title, body: t.storeApplication.step2Body },
    { title: t.storeApplication.step3Title, body: t.storeApplication.step3Body },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Badge tone="marigold">{t.storeApplication.badge}</Badge>
      <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
        {t.storeApplication.titleLead}
        <span className="text-marigold-600">{t.storeApplication.titleAccent}</span>
        {t.storeApplication.titleTail}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-bark-600">{t.storeApplication.intro}</p>

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
        {t.storeApplication.applyHeading}
        <span aria-hidden className="ml-3 inline-block h-1 w-12 rounded-full bg-marigold-500" />
      </h2>
      <StoreApplicationForm />
    </div>
  );
}
