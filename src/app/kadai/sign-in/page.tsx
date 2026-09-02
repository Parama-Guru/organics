import { redirect } from "next/navigation";

import { StoreSignInForm } from "@/app/kadai/forms";
import { PortalLanguageToggle } from "@/components/portal-language-toggle";
import { getPreferredLocale } from "@/lib/i18n/preference";
import { PORTAL_COPY } from "@/lib/i18n/portal-copy";
import { STORE_PORTAL, getStore } from "@/lib/store-auth";

export const dynamic = "force-dynamic";

export default async function StoreSignInPage() {
  if (await getStore()) redirect(STORE_PORTAL);

  const locale = await getPreferredLocale();
  const copy = PORTAL_COPY[locale];

  return (
    <div className="mx-auto max-w-md" lang={locale}>
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-3xl text-bark-900">{copy.storeTitle}</h1>
        <PortalLanguageToggle
          locale={locale}
          returnTo="/kadai/sign-in"
          label={copy.language}
          switchTo={copy.switchTo}
        />
      </div>
      <p className="mt-2 leading-relaxed text-ink">{copy.storeIntro}</p>
      <StoreSignInForm copy={copy} />
      <div className="mt-6 space-y-2 border-t border-bark-200 pt-4 text-sm leading-relaxed text-bark-600">
        <p>{copy.storeNoAccess}</p>
        <p>{copy.storeForgot}</p>
      </div>
    </div>
  );
}
