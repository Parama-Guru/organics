"use client";

import { useActionState, useState } from "react";

import {
  changePasswordAction,
  deleteAccountAction,
  type ActionState,
} from "@/app/[lang]/account/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/client";

export function PasswordForm() {
  const { locale, t } = useI18n();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    changePasswordAction.bind(null, locale),
    {},
  );
  const bad = new Set(state.fields ?? []);

  return (
    <form action={formAction} className="mt-5 grid gap-4 sm:max-w-md">
      <Field
        label={t.account.currentPassword}
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        maxLength={200}
        invalid={bad.has("currentPassword")}
        error={state.error === "badCurrentPassword" ? t.account.errorCurrentPassword : undefined}
      />
      <Field
        label={t.account.newPassword}
        hint={t.account.passwordHint}
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        maxLength={200}
        invalid={bad.has("newPassword")}
        error={bad.has("newPassword") ? t.account.fieldPassword : undefined}
      />
      <p className="text-sm leading-relaxed text-bark-600">{t.account.changePasswordNote}</p>
      <Button type="submit" variant="secondary" disabled={pending} className="justify-self-start">
        {pending ? t.account.working : t.account.changePassword}
      </Button>
    </form>
  );
}

export function DeleteAccountForm({ problem }: { problem: "confirm" | "password" | null }) {
  const { locale, t } = useI18n();
  const [typed, setTyped] = useState("");

  return (
    <form action={deleteAccountAction.bind(null, locale)} className="mt-4 grid gap-3 sm:max-w-md">
      {/* The password is required as well as the typed word: this is more
          destructive than changing a password, which already asks for it. */}
      <Field
        label={t.account.dangerPasswordLabel}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={200}
        invalid={problem === "password"}
        error={problem === "password" ? t.account.dangerWrongPassword : undefined}
      />
      <Field
        label={t.account.dangerConfirmLabel}
        name="confirm"
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        autoComplete="off"
        maxLength={20}
        placeholder={t.account.dangerConfirm}
        invalid={problem === "confirm"}
        error={problem === "confirm" ? t.account.dangerNotConfirmed : undefined}
      />
      <Button
        type="submit"
        variant="secondary"
        disabled={typed.trim().toLowerCase() !== t.account.dangerConfirm.toLowerCase()}
        className="justify-self-start border-red-300 text-red-700 hover:bg-red-50"
      >
        {t.account.dangerButton}
      </Button>
    </form>
  );
}
