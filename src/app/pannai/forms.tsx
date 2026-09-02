"use client";

import { useActionState } from "react";

import { acceptInviteAction, farmerSignInAction, type PortalState } from "@/app/pannai/actions";
import type { PortalCopy } from "@/lib/i18n/portal-copy";

function messageFor(copy: PortalCopy, error: string | undefined): string {
  switch (error) {
    case "badCredentials":
      return copy.errorBadCredentials;
    case "rateLimited":
      return copy.errorRateLimited;
    case "unavailable":
      return copy.errorUnavailable;
    case "inviteExpired":
      return copy.errorInviteExpired;
    case "emailPassword":
      return copy.errorEmailPassword;
    default:
      return copy.errorInvalid;
  }
}

const field =
  "mt-2 w-full rounded-2xl border border-bark-200 bg-paper px-4 py-3 " +
  "focus:border-leaf-500 focus:outline-none focus:ring-4 focus:ring-leaf-400/20";

export function FarmerSignInForm({ copy }: { copy: PortalCopy }) {
  const [state, formAction, pending] = useActionState<PortalState, FormData>(
    farmerSignInAction,
    {},
  );

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <label className="block">
        <span className="text-sm font-semibold text-bark-900">{copy.email}</span>
        <input
          name="email"
          type="email"
          defaultValue={state.values?.email ?? ""}
          autoComplete="email"
          required
          maxLength={200}
          className={field}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-bark-900">{copy.password}</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          className={field}
        />
      </label>

      {state.error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {messageFor(copy, state.error)}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-full bg-marigold-500 px-6 font-medium text-on-action disabled:opacity-55"
      >
        {pending ? copy.working : copy.submit}
      </button>
    </form>
  );
}

export function AcceptInviteForm({
  farmId,
  token,
  copy,
}: {
  farmId: string;
  token: string;
  copy: PortalCopy;
}) {
  const [state, formAction, pending] = useActionState<PortalState, FormData>(
    acceptInviteAction.bind(null, farmId, token),
    {},
  );

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <label className="block">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-bark-900">{copy.newPassword}</span>
          <span className="text-sm text-bark-600">{copy.minCharacters}</span>
        </span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={200}
          className={field}
        />
      </label>

      {state.error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {messageFor(copy, state.error)}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-full bg-marigold-500 px-6 font-medium text-on-action disabled:opacity-55"
      >
        {pending ? copy.working : copy.setPassword}
      </button>
    </form>
  );
}
