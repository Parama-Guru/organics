"use client";

import { useActionState } from "react";

import {
  performResetAction,
  requestResetAction,
  type ActionState,
} from "@/app/[lang]/account/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { CheckIcon } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/client";

export function RequestResetForm() {
  const { locale, t } = useI18n();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    requestResetAction.bind(null, locale),
    {},
  );

  // Always the same answer, whether or not the address is registered, so the
  // form cannot be used to find out who has an account.
  if (state.ok) {
    return (
      <p
        role="status"
        className="mt-6 flex items-start gap-2 rounded-xl bg-leaf-50 p-4 leading-relaxed text-leaf-800 ring-1 ring-inset ring-leaf-200"
      >
        <CheckIcon className="mt-1 shrink-0" />
        {t.account.forgotSent}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-7 grid gap-4">
      <Field
        label={t.account.email}
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={200}
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t.account.working : t.account.forgotSubmit}
      </Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const { locale, t } = useI18n();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    performResetAction.bind(null, locale, token),
    {},
  );

  return (
    <form action={formAction} className="mt-7 grid gap-4">
      <Field
        label={t.account.newPassword}
        hint={t.account.passwordHint}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        maxLength={200}
        invalid={state.fields?.includes("password")}
        error={state.fields?.includes("password") ? t.account.fieldPassword : undefined}
      />

      {state.error === "resetExpired" ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {t.account.resetExpired}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t.account.working : t.account.resetSubmit}
      </Button>
    </form>
  );
}
