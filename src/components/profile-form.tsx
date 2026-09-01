"use client";

import { useActionState } from "react";

import { updateProfileAction, type ActionState } from "@/app/[lang]/account/actions";
import { Button } from "@/components/ui/button";
import { Field, SelectField } from "@/components/ui/field";
import { CheckIcon } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/client";

export function ProfileForm({
  name,
  phone,
  region,
  profileLocale,
}: {
  name: string;
  phone: string;
  region: string;
  profileLocale: string;
}) {
  const { locale, t } = useI18n();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateProfileAction.bind(null, locale),
    {},
  );
  const bad = new Set(state.fields ?? []);
  const kept = state.values ?? {};

  return (
    <form action={formAction} className="mt-5 grid gap-4 sm:grid-cols-2">
      <Field
        label={t.account.name}
        name="name"
        defaultValue={kept.name ?? name}
        autoComplete="name"
        required
        minLength={2}
        maxLength={80}
        invalid={bad.has("name")}
        error={bad.has("name") ? t.account.fieldName : undefined}
      />
      <Field
        label={t.account.phone}
        hint={t.account.phoneHint}
        name="phone"
        type="tel"
        defaultValue={kept.phone ?? phone}
        autoComplete="tel"
        maxLength={20}
        invalid={bad.has("phone")}
        error={bad.has("phone") ? t.account.fieldPhone : undefined}
      />
      <Field
        label={t.account.region}
        hint={t.account.regionHint}
        name="region"
        defaultValue={kept.region ?? region}
        autoComplete="address-level2"
        maxLength={80}
        invalid={bad.has("region")}
      />
      <SelectField label={t.account.language} name="locale" defaultValue={profileLocale}>
        <option value="ta">தமிழ்</option>
        <option value="en">English</option>
      </SelectField>

      {state.error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
          {t.account.errorInvalid}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? t.account.working : t.account.save}
        </Button>
        {/* Pressing save used to change nothing you could see from the form. */}
        {state.ok ? (
          <p role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-leaf-700">
            <CheckIcon /> {t.account.savedChanges}
          </p>
        ) : null}
      </div>
    </form>
  );
}
