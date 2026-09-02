"use client";

import { useActionState } from "react";

import { acceptInviteAction, farmerSignInAction, type PortalState } from "@/app/pannai/actions";

const MESSAGES: Record<string, string> = {
  badCredentials: "அந்த மின்னஞ்சலும் கடவுச்சொல்லும் பொருந்தவில்லை.",
  rateLimited: "மிகப் பல முயற்சிகள். சுமார் 15 நிமிடங்கள் கழித்து முயலுங்கள்.",
  unavailable: "இந்தப் பகுதி இப்போது கிடைக்கவில்லை.",
  inviteExpired: "இந்த அழைப்பு காலாவதியாகிவிட்டது. நிர்வாகியிடம் புதிதாகக் கேளுங்கள்.",
  emailPassword: "மின்னஞ்சலில் உள்ள பெயரை கடவுச்சொல்லில் பயன்படுத்த வேண்டாம்.",
  invalid: "குறியிட்ட பகுதியைச் சரிபார்க்கவும்.",
};

const field =
  "mt-2 w-full rounded-2xl border border-bark-200 bg-paper px-4 py-3 " +
  "focus:border-leaf-500 focus:outline-none focus:ring-4 focus:ring-leaf-400/20";

export function FarmerSignInForm() {
  const [state, formAction, pending] = useActionState<PortalState, FormData>(
    farmerSignInAction,
    {},
  );

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <label className="block">
        <span className="text-sm font-semibold text-bark-900">மின்னஞ்சல்</span>
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
        <span className="text-sm font-semibold text-bark-900">கடவுச்சொல்</span>
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
          {MESSAGES[state.error] ?? MESSAGES.invalid}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-full bg-marigold-500 px-6 font-medium text-bark-900 disabled:opacity-55"
      >
        {pending ? "ஒரு நிமிடம்…" : "உள்ளே செல்ல"}
      </button>
    </form>
  );
}

export function AcceptInviteForm({ farmId, token }: { farmId: string; token: string }) {
  const [state, formAction, pending] = useActionState<PortalState, FormData>(
    acceptInviteAction.bind(null, farmId, token),
    {},
  );

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <label className="block">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-bark-900">புதிய கடவுச்சொல்</span>
          <span className="text-sm text-bark-600">குறைந்தது 10 எழுத்துகள்</span>
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
          {MESSAGES[state.error] ?? MESSAGES.invalid}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-full bg-marigold-500 px-6 font-medium text-bark-900 disabled:opacity-55"
      >
        {pending ? "ஒரு நிமிடம்…" : "கடவுச்சொல்லை அமைக்க"}
      </button>
    </form>
  );
}
