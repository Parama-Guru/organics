import Link from "next/link";

import { GlassPanel } from "@/components/glass-panel";
import { Button } from "@/components/ui/button";
import { ShieldCheckIcon } from "@/components/ui/icons";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export function MemberGate({
  locale,
  t,
  returnPath,
}: {
  locale: Locale;
  t: Dictionary;
  returnPath: string;
}) {
  const next = encodeURIComponent(returnPath);

  return (
    <GlassPanel as="section" className="mt-12 rounded-3xl p-6 sm:mt-16 sm:p-8">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-leaf-100 text-xl text-leaf-800">
        <ShieldCheckIcon />
      </span>
      <h2 className="mt-4 font-display text-2xl sm:text-3xl">{t.account.detailGateTitle}</h2>
      <p className="mt-2 max-w-2xl leading-relaxed text-bark-600">
        {t.account.detailGateBody}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          as={Link}
          href={`${localePath(locale, "/account/sign-in")}?next=${next}`}
          size="lg"
        >
          {t.account.detailGateSignIn}
        </Button>
        <Button
          as={Link}
          href={`${localePath(locale, "/account/sign-up")}?next=${next}`}
          size="lg"
          variant="secondary"
        >
          {t.account.detailGateCreate}
        </Button>
      </div>
    </GlassPanel>
  );
}
