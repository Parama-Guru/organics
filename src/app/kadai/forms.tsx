"use client";

import { useActionState } from "react";

import {
  acceptStoreInviteAction,
  storeSignInAction,
  updateStoreProfileAction,
  type StorePortalState,
} from "@/app/kadai/actions";

const MESSAGES: Record<string, string> = {
  badCredentials: "அந்த மின்னஞ்சலும் கடவுச்சொல்லும் பொருந்தவில்லை.",
  rateLimited: "மிகப் பல முயற்சிகள். சுமார் 15 நிமிடங்கள் கழித்து முயலுங்கள்.",
  unavailable: "இந்தப் பகுதி இப்போது கிடைக்கவில்லை.",
  inviteExpired: "இந்த அழைப்பு காலாவதியாகிவிட்டது. நிர்வாகியிடம் புதிய இணைப்பு கேளுங்கள்.",
  emailPassword: "மின்னஞ்சலில் உள்ள பெயரை கடவுச்சொல்லில் பயன்படுத்த வேண்டாம்.",
  invalid: "குறியிட்ட பகுதிகளைச் சரிபார்க்கவும்.",
};

const field =
  "mt-2 w-full rounded-2xl border border-bark-200 bg-paper px-4 py-3 " +
  "focus:border-leaf-500 focus:outline-none focus:ring-4 focus:ring-leaf-400/20";

function ErrorMessage({ state }: { state: StorePortalState }) {
  return state.error ? (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {MESSAGES[state.error] ?? MESSAGES.invalid}
    </p>
  ) : null;
}

export function StoreSignInForm() {
  const [state, formAction, pending] = useActionState<StorePortalState, FormData>(
    storeSignInAction,
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
      <ErrorMessage state={state} />
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

export function AcceptStoreInviteForm({ storeId, token }: { storeId: string; token: string }) {
  const [state, formAction, pending] = useActionState<StorePortalState, FormData>(
    acceptStoreInviteAction.bind(null, storeId, token),
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
      <ErrorMessage state={state} />
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

export function StoreProfileForm({
  initial,
}: {
  initial: { phone: string; addressLine: string; about: string; aboutTa: string };
}) {
  const [state, formAction, pending] = useActionState<StorePortalState, FormData>(
    updateStoreProfileAction,
    {},
  );
  const value = (key: keyof typeof initial) => state.values?.[key] ?? initial[key];
  const invalid = (key: string) => state.fields?.includes(key) ?? false;

  return (
    <form action={formAction} className="mt-6 grid gap-4 rounded-2xl border border-bark-200 bg-white p-5">
      <label className="block">
        <span className="text-sm font-semibold text-bark-900">தொலைபேசி</span>
        <input
          name="phone"
          type="tel"
          defaultValue={value("phone")}
          aria-invalid={invalid("phone")}
          required
          maxLength={20}
          autoComplete="tel"
          className={field}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-bark-900">கடை முகவரி</span>
        <textarea
          name="addressLine"
          defaultValue={value("addressLine")}
          aria-invalid={invalid("addressLine")}
          required
          minLength={6}
          maxLength={240}
          rows={3}
          autoComplete="street-address"
          className={field}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-bark-900">கடை பற்றி — English</span>
        <textarea
          name="about"
          defaultValue={value("about")}
          aria-invalid={invalid("about")}
          required
          minLength={20}
          maxLength={1000}
          rows={5}
          className={field}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-bark-900">கடை பற்றி — தமிழ்</span>
        <textarea
          name="aboutTa"
          defaultValue={value("aboutTa")}
          aria-invalid={invalid("aboutTa")}
          maxLength={1000}
          rows={5}
          className={field}
        />
      </label>
      <ErrorMessage state={state} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-full bg-marigold-500 px-6 font-medium text-bark-900 disabled:opacity-55"
      >
        {pending ? "சேமிக்கிறது…" : "மாற்றங்களைச் சேமிக்க"}
      </button>
    </form>
  );
}
