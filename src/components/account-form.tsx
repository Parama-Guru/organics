"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction, signUpAction, type ActionState } from "@/app/[lang]/account/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/client";
import { localePath } from "@/lib/i18n/config";

const ERRORS = {
  invalid: "errorInvalid",
  badCredentials: "errorCredentials",
  rateLimited: "errorRateLimited",
  signUpFailed: "errorSignUp",
  unavailable: "errorUnavailable",
} as const;

export function AccountForm({ mode, next }: { mode: "signIn" | "signUp"; next?: string }) {
  const { locale, t } = useI18n();
  const action = mode === "signUp" ? signUpAction : signInAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action.bind(null, locale, next ?? null),
    {},
  );

  const messageKey = state.error ? ERRORS[state.error as keyof typeof ERRORS] : null;
  const bad = new Set(state.fields ?? []);
  // A rejected submit used to come back blank, which on a phone meant retyping
  // an email address just to correct a password.
  const kept = state.values ?? {};

  return (
    <form action={formAction} className="mt-7 grid gap-4">
      {mode === "signUp" ? (
        <Field
          label={t.account.name}
          name="name"
          defaultValue={kept.name ?? ""}
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          invalid={bad.has("name")}
          error={bad.has("name") ? t.account.fieldName : undefined}
        />
      ) : null}

      <Field
        label={t.account.email}
        name="email"
        type="email"
        defaultValue={kept.email ?? ""}
        autoComplete="email"
        required
        maxLength={200}
        invalid={bad.has("email")}
        error={bad.has("email") ? t.account.fieldEmail : undefined}
      />

      <Field
        label={t.account.password}
        hint={mode === "signUp" ? t.account.passwordHint : undefined}
        name="password"
        type="password"
        autoComplete={mode === "signUp" ? "new-password" : "current-password"}
        required
        minLength={mode === "signUp" ? 10 : 1}
        maxLength={200}
        invalid={bad.has("password")}
        error={bad.has("password") ? t.account.fieldPassword : undefined}
      />

      {mode === "signUp" ? (
        <>
          <Field
            label={t.account.phone}
            hint={t.account.phoneHint}
            name="phone"
            type="tel"
            defaultValue={kept.phone ?? ""}
            autoComplete="tel"
            maxLength={20}
            placeholder="+91 98765 43210"
            invalid={bad.has("phone")}
            error={bad.has("phone") ? t.account.fieldPhone : undefined}
          />
          <Field
            label={t.account.region}
            hint={t.account.regionHint}
            name="region"
            defaultValue={kept.region ?? ""}
            autoComplete="address-level2"
            maxLength={80}
            invalid={bad.has("region")}
          />
        </>
      ) : null}

      {messageKey ? (
        <p
          role="alert"
          className="animate-pop rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {t.account[messageKey]}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending
          ? t.account.working
          : mode === "signUp"
            ? t.account.submitSignUp
            : t.account.submitSignIn}
      </Button>

      <p className="text-sm text-bark-600">
        {mode === "signUp" ? t.account.haveAccount : t.account.noAccount}{" "}
        <Link
          href={
            next
              ? `${localePath(locale, mode === "signUp" ? "/account/sign-in" : "/account/sign-up")}?next=${encodeURIComponent(next)}`
              : localePath(locale, mode === "signUp" ? "/account/sign-in" : "/account/sign-up")
          }
          className="font-semibold text-brand underline underline-offset-4"
        >
          {mode === "signUp" ? t.account.signInInstead : t.account.createOne}
        </Link>
      </p>
    </form>
  );
}
