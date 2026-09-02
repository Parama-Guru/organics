import { loadConfig } from "@/../conf/config";
import { ShieldCheckIcon } from "@/components/ui/icons";
import { format } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-static";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.trust.heading, description: t.trust.intro };
}

export default async function HowWeCheckPage() {
  const t = await getDictionary();
  const contactEmail = loadConfig().app.contact_email;

  const checks = [
    { title: t.trust.check1Title, body: t.trust.check1Body },
    { title: t.trust.check2Title, body: t.trust.check2Body },
    { title: t.trust.check3Title, body: t.trust.check3Body },
    { title: t.trust.check4Title, body: t.trust.check4Body },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <header className="grid grid-cols-[minmax(0,1fr)] gap-6 border-b border-bark-200 pb-10 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] lg:items-end lg:pb-14">
        <div>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-inverse text-2xl text-marigold-400">
            <ShieldCheckIcon />
          </span>
          <p className="section-kicker mt-5">Verification field guide</p>
        </div>
        <div>
          <h1 className="editorial-heading">{t.trust.heading}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bark-600 sm:text-xl">{t.trust.intro}</p>
        </div>
      </header>

      <ol className="mt-12 border-t border-bark-200">
        {checks.map((check, index) => (
          <li key={check.title} className="grid gap-5 border-b border-bark-200 py-8 sm:grid-cols-[5rem_0.8fr_1.2fr] sm:items-start sm:py-11">
            <span className="font-mono text-sm text-leaf-700">0{index + 1}</span>
            <h2 className="font-display text-3xl font-medium leading-none text-bark-900">{check.title}</h2>
            <p className="max-w-xl text-lg leading-relaxed text-bark-600">{check.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-16 rounded-[2rem] bg-inverse p-7 text-white sm:p-10 lg:p-14">
      <p className="section-kicker section-kicker--dark">The boundary</p>
      <h2 className="mt-5 font-display text-4xl text-white sm:text-5xl">{t.trust.limitsHeading}</h2>
      <p className="mt-5 max-w-3xl text-lg leading-relaxed text-bark-100">{t.trust.limitsBody}</p>

      {/* Only offered when an address is actually configured. Telling people to
          report a listing and then publishing no way to do it is worse than
          saying nothing. */}
      {contactEmail ? (
        <p className="mt-5 leading-relaxed text-bark-100">
          {t.trust.reportLead}{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="font-semibold text-white underline underline-offset-4"
          >
            {contactEmail}
          </a>
          {format(t.trust.reportTail, { email: contactEmail })}
        </p>
      ) : null}
      </section>
    </div>
  );
}
