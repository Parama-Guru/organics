"use client";

import { signOutAction } from "@/app/[lang]/account/actions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export function SignOutButton() {
  const { locale, t } = useI18n();

  return (
    <form action={signOutAction.bind(null, locale)}>
      <Button type="submit" variant="ghost" size="sm">
        {t.account.signOut}
      </Button>
    </form>
  );
}
