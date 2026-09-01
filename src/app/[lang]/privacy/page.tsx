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
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl sm:text-4xl">{t.privacy.heading}</h1>
      <p className="mt-3 text-lg leading-relaxed text-bark-600">{t.privacy.intro}</p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-xl">{section.title}</h2>
            <p className="mt-2 leading-relaxed text-ink">{section.body}</p>
          </section>
        ))}

        {/* The rights section promises an address; print it, or do not promise. */}
        {contactEmail ? (
          <p className="leading-relaxed text-ink">
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
