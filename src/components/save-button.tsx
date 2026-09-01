"use client";

import { useState, useTransition } from "react";

import { toggleSavedFarmerAction, toggleSavedProductAction } from "@/app/[lang]/account/actions";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, CheckIcon } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/client";

/**
 * Optimistic toggle. The saved state is small and reversible, so flipping it
 * immediately and rolling back on failure reads better than a spinner on every
 * tap; the server action is the source of truth either way.
 */
export function SaveButton({
  kind,
  id,
  initialSaved,
  size = "md",
  full = false,
  removeLabel = false,
}: {
  kind: "product" | "farmer";
  id: string;
  initialSaved: boolean;
  size?: "sm" | "md" | "lg";
  full?: boolean;
  // On the account page the list is already "saved", so the useful verb there
  // is Remove.
  removeLabel?: boolean;
}) {
  const { t } = useI18n();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const previous = saved;
    setSaved(!previous);
    startTransition(async () => {
      const action = kind === "product" ? toggleSavedProductAction : toggleSavedFarmerAction;
      const next = await action(id);
      setSaved(next);
    });
  }

  const label = saved ? (removeLabel ? t.account.removeItem : t.account.savedItem) : t.account.saveItem;

  return (
    <Button
      type="button"
      onClick={toggle}
      disabled={pending}
      size={size}
      variant={saved ? "secondary" : "ghost"}
      aria-pressed={saved}
      className={`${full ? "w-full" : ""} border-bark-200`}
    >
      {saved ? <CheckIcon /> : <BookmarkIcon />}
      {label}
    </Button>
  );
}
