"use client";

import { useActionState, useState } from "react";

import {
  changePasswordAction,
  deleteAccountAction,
  resendVerificationAction,
  type ActionState,
} from "@/app/[lang]/account/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";

export function PasswordForm({
  hasPassword,
  googleLinked,
  invalidNewPassword = false,
}: {
  hasPassword: boolean;
  googleLinked: boolean;
  invalidNewPassword?: boolean;
}) {
  if (!hasPassword) {
    return googleLinked ? (
      <GoogleSetPasswordForm invalid={invalidNewPassword} />
    ) : null;
  }

  return <ChangePasswordForm />;
}

function ChangePasswordForm() {
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
      <p className="text-sm leading-relaxed text-bark-600">
        {t.account.changePasswordNote}
      </p>
      <Button type="submit" variant="secondary" disabled={pending} className="justify-self-start">
        {pending ? t.account.working : t.account.changePassword}
      </Button>
      {state.ok ? <p className="text-sm font-medium text-leaf-700">{t.account.savedChanges}</p> : null}
    </form>
  );
}

function GoogleSetPasswordForm({ invalid }: { invalid: boolean }) {
  const { locale, t } = useI18n();
  const query = new URLSearchParams({
    locale,
    next: localePath(locale, "/account"),
  });

  return (
    <form
      action={`/api/auth/google?${query}`}
      method="post"
      className="mt-5 grid gap-4 sm:max-w-md"
    >
      <input type="hidden" name="operation" value="set-password" />
      <Field
        label={t.account.newPassword}
        hint={t.account.passwordHint}
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        maxLength={200}
        invalid={invalid}
        error={invalid ? t.account.fieldPassword : undefined}
      />
      <p className="text-sm leading-relaxed text-bark-600">{t.account.setPasswordNote}</p>
      <Button type="submit" variant="secondary" className="justify-self-start">
        {t.account.setPasswordGoogle}
      </Button>
    </form>
  );
}

export function GoogleUnlinkButton({ canUnlink }: { canUnlink: boolean }) {
  const { locale, t } = useI18n();

  if (!canUnlink) {
    return <p className="mt-3 text-sm text-bark-600">{t.account.unlinkNeedsPassword}</p>;
  }

  const query = new URLSearchParams({
    locale,
    next: localePath(locale, "/account"),
  });

  return (
    <form action={`/api/auth/google?${query}`} method="post" className="mt-3">
      <input type="hidden" name="operation" value="unlink" />
      <Button type="submit" variant="secondary">
        {t.account.unlinkGoogle}
      </Button>
    </form>
  );
}

export function EmailVerificationButton() {
  const { locale, t } = useI18n();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    resendVerificationAction.bind(null, locale),
    {},
  );

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-center gap-3">
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? t.account.working : t.account.emailVerifySend}
      </Button>
      {state.ok ? <p className="text-sm text-leaf-700">{t.account.emailVerifySent}</p> : null}
      {state.error ? <p className="text-sm text-red-700">{t.account.errorUnavailable}</p> : null}
    </form>
  );
}

export function GoogleDeleteForm({ invalid = false }: { invalid?: boolean }) {
  const { locale, t } = useI18n();
  const [typed, setTyped] = useState("");
  const confirmed = typed.trim().toLowerCase() === t.account.dangerConfirm.toLowerCase();

  return (
    <form
      action={`/api/auth/google?${new URLSearchParams({
        locale,
        next: localePath(locale, "/account"),
      })}`}
      method="post"
      className="mt-4 grid gap-3 sm:max-w-md"
    >
      <input type="hidden" name="operation" value="delete" />
      <Field
        label={t.account.dangerConfirmLabel}
        name="confirm"
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        autoComplete="off"
        maxLength={20}
        placeholder={t.account.dangerConfirm}
        invalid={invalid}
        error={invalid ? t.account.dangerNotConfirmed : undefined}
      />
      <Button type="submit" variant="danger" disabled={!confirmed}>
        {t.account.dangerGoogleButton}
      </Button>
    </form>
  );
}

export function DeleteAccountForm({
  problem,
}: {
  problem: "confirm" | "password" | "billing" | null;
}) {
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
      {problem === "billing" ? (
        <p role="alert" className="text-sm font-medium text-red-800">
          {t.account.deleteBillingFailed}
        </p>
      ) : null}
    </form>
  );
}
