import { loadConfig } from "@conf/config";
import { accountsEnabled } from "@/lib/customer-auth";
import { getDictionary } from "@/lib/i18n/server";

// Reads whether accounts are on, so the page cannot describe a feature the
// deployment does not run.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getDictionary();
  return { title: t.privacy.heading, description: t.privacy.intro };
}

export default async function PrivacyPage() {
  const t = await getDictionary();
  const contactEmail = loadConfig().app.contact_email;

  const sections = [
    { title: t.privacy.s1Title, body: t.privacy.s1Body },
    // Only shown where accounts actually exist: describing data collection that
    // is switched off is as wrong as failing to describe collection that is on.
    ...(accountsEnabled() ? [{ title: t.privacy.s1bTitle, body: t.privacy.s1bBody }] : []),
    { title: t.privacy.s2Title, body: t.privacy.s2Body },
    { title: t.privacy.s3Title, body: t.privacy.s3Body },
    { title: t.privacy.s4Title, body: t.privacy.s4Body },
    { title: t.privacy.s5Title, body: t.privacy.s5Body },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
      <header className="border-b border-bark-200 pb-10 sm:pb-14">
      <p className="section-kicker">Legal field note</p>
      <h1 className="editorial-heading mt-6">{t.privacy.heading}</h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bark-600 sm:text-xl">{t.privacy.intro}</p>
      </header>

      <div className="mt-10 border-t border-bark-200">
        {sections.map((section, index) => (
          <section key={section.title} className="grid gap-4 border-b border-bark-200 py-8 sm:grid-cols-[4rem_0.8fr_1.2fr] sm:py-10">
            <span className="font-mono text-xs text-leaf-700">0{index + 1}</span>
            <h2 className="font-display text-2xl font-medium leading-none">{section.title}</h2>
            <p className="leading-relaxed text-bark-600">{section.body}</p>
          </section>
        ))}

        {/* The rights section promises an address; print it, or do not promise. */}
        {contactEmail ? (
          <p className="py-8 leading-relaxed text-ink">
            {t.privacy.s4Contact}{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="font-semibold text-brand underline underline-offset-4"
            >
              {contactEmail}
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
