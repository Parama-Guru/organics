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
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf-100 text-2xl text-leaf-800">
        <ShieldCheckIcon />
      </span>
      <h1 className="mt-5 font-display text-3xl sm:text-4xl">{t.trust.heading}</h1>
      <p className="mt-3 text-lg leading-relaxed text-bark-600">{t.trust.intro}</p>

      <ol className="mt-10 space-y-4">
        {checks.map((check, index) => (
          <li key={check.title} className="glass rounded-2xl p-6">
            <span className="font-display text-sm text-marigold-600">0{index + 1}</span>
            <h2 className="mt-1 font-display text-xl">{check.title}</h2>
            <p className="mt-2 leading-relaxed text-bark-600">{check.body}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-12 font-display text-2xl sm:text-3xl">{t.trust.limitsHeading}</h2>
      <p className="mt-3 leading-relaxed text-ink">{t.trust.limitsBody}</p>

      {/* Only offered when an address is actually configured. Telling people to
          report a listing and then publishing no way to do it is worse than
          saying nothing. */}
      {contactEmail ? (
        <p className="mt-3 leading-relaxed text-ink">
          {t.trust.reportLead}{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="font-semibold text-brand underline underline-offset-4"
          >
            {contactEmail}
          </a>
          {format(t.trust.reportTail, { email: contactEmail })}
        </p>
      ) : null}
    </div>
  );
}
