import { redirect } from "next/navigation";

import { FarmerSignInForm } from "@/app/pannai/forms";
import { PortalLanguageToggle } from "@/components/portal-language-toggle";
import { FARMER_PORTAL, getFarmer } from "@/lib/farmer-auth";
import { getPreferredLocale } from "@/lib/i18n/preference";
import { PORTAL_COPY } from "@/lib/i18n/portal-copy";

export const dynamic = "force-dynamic";

export default async function FarmerSignInPage() {
  if (await getFarmer()) redirect(FARMER_PORTAL);

  const locale = await getPreferredLocale();
  const copy = PORTAL_COPY[locale];

  // The document is Tamil, so an English sign-in screen has to say so for the
  // region it occupies rather than silently mislabelling itself.
  return (
    <div className="mx-auto max-w-md" lang={locale}>
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-3xl text-bark-900">{copy.farmTitle}</h1>
        <PortalLanguageToggle
          locale={locale}
          returnTo="/pannai/sign-in"
          label={copy.language}
          switchTo={copy.switchTo}
        />
      </div>
      <p className="mt-2 leading-relaxed text-ink">{copy.farmIntro}</p>
      <FarmerSignInForm copy={copy} />
      {/* Active phrasing, and it answers the two questions a farmer standing at
          this screen actually has: I have no login, and I forgot my password.
          There is no self-serve reset because outbound email is optional here,
          so saying who to ring is the honest answer rather than a dead link. */}
      <div className="mt-6 space-y-2 border-t border-bark-200 pt-4 text-sm leading-relaxed text-bark-600">
        <p>{copy.farmNoAccess}</p>
        <p>{copy.farmForgot}</p>
      </div>
    </div>
  );
}
