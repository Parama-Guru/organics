"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Field } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/client";
import { scorePassword, type StrengthAdvice, type StrengthScore } from "@/lib/password-strength";
import { USERNAME_PATTERN, normalizeUsername } from "@/lib/username";

type Availability = "idle" | "invalid" | "checking" | "free" | "taken" | "error";

/**
 * Live handle availability. The answer is advice only: the same rules run again
 * in the server action, and the unique index is what actually decides.
 */
export function UsernameField({
  value,
  onChange,
  invalid,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  error?: string;
}) {
  const { t } = useI18n();
  const [answer, setAnswer] = useState<{ handle: string; status: Availability } | null>(null);
  const statusId = useId();
  const abort = useRef<AbortController | null>(null);

  const handle = normalizeUsername(value);
  const wellFormed = handle.length > 0 && USERNAME_PATTERN.test(handle);

  // Derived during render rather than pushed into state by the effect, so the
  // shape of the handle never costs an extra render pass.
  const status: Availability =
    handle.length === 0
      ? "idle"
      : !wellFormed
        ? "invalid"
        : answer?.handle === handle
          ? answer.status
          : "checking";

  useEffect(() => {
    if (!wellFormed) return;

    // One request per pause in typing, and the previous one is cancelled, so a
    // fast typist never races an older answer onto the screen.
    const timer = setTimeout(() => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;

      fetch("/api/account/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: handle }),
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error("failed"))))
        .then((body: { available?: boolean; code?: string }) => {
          if (controller.signal.aborted) return;
          const resolved: Availability =
            body.code === "invalid_username" ? "invalid" : body.available ? "free" : "taken";
          setAnswer({ handle, status: resolved });
        })
        .catch((reason: unknown) => {
          if ((reason as { name?: string })?.name === "AbortError") return;
          setAnswer({ handle, status: "error" });
        });
    }, 450);

    return () => clearTimeout(timer);
  }, [handle, wellFormed]);

  useEffect(() => () => abort.current?.abort(), []);

  const message =
    status === "checking"
      ? t.account.usernameChecking
      : status === "free"
        ? t.account.usernameAvailable
        : status === "taken"
          ? t.account.usernameTaken
          : status === "invalid"
            ? t.account.usernameInvalid
            : "";

  const tone =
    status === "free" ? "text-leaf-700" : status === "checking" ? "text-bark-600" : "text-red-700";

  return (
    <div>
      <Field
        label={t.account.username}
        hint={t.account.usernameHint}
        name="username"
        value={value}
        onChange={(event) => onChange(normalizeUsername(event.target.value))}
        autoComplete="username"
        inputMode="text"
        spellCheck={false}
        required
        minLength={3}
        maxLength={20}
        pattern="[a-z0-9_]{3,20}"
        aria-describedby={statusId}
        invalid={invalid || status === "taken" || status === "invalid"}
        error={error}
      />
      <p id={statusId} role="status" aria-live="polite" className={`mt-1 min-h-5 text-sm ${tone}`}>
        {message}
      </p>
    </div>
  );
}

const ADVICE = {
  length: "strengthLength",
  variety: "strengthVariety",
  common: "strengthCommon",
  personal: "strengthPersonal",
  repeat: "strengthRepeat",
  ok: "strengthOk",
} as const satisfies Record<StrengthAdvice, string>;

const BAR: Record<StrengthScore, string> = {
  0: "bg-red-500",
  1: "bg-red-500",
  2: "bg-marigold-600",
  3: "bg-leaf-500",
  4: "bg-leaf-600",
};

/** Password entry with a meter that scores exactly what the server will score. */
export function PasswordField({
  value,
  onChange,
  personal,
  invalid,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  personal: readonly string[];
  invalid?: boolean;
  error?: string;
}) {
  const { t } = useI18n();
  const meterId = useId();
  const strength = scorePassword(value, personal);
  const labels = [
    t.account.strength0,
    t.account.strength1,
    t.account.strength2,
    t.account.strength3,
    t.account.strength4,
  ] as const;

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
    [onChange],
  );

  return (
    <div>
      <Field
        label={t.account.password}
        hint={t.account.passwordHint}
        name="password"
        type="password"
        value={value}
        onChange={handleChange}
        autoComplete="new-password"
        required
        minLength={10}
        maxLength={200}
        aria-describedby={meterId}
        invalid={invalid}
        error={error}
      />

      {/* The bars are decoration; the wording beside them is what a screen
          reader announces, and it only re-announces when it changes. */}
      <div className="mt-2 flex items-center gap-3">
        <span aria-hidden className="flex flex-1 gap-1">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                value && index < strength.score ? BAR[strength.score] : "bg-bark-200"
              }`}
            />
          ))}
        </span>
        <span className="rule-label shrink-0 text-bark-600">{t.account.passwordStrength}</span>
      </div>
      <p id={meterId} role="status" aria-live="polite" className="mt-1 min-h-5 text-sm text-bark-600">
        {value ? `${labels[strength.score]} — ${t.account[ADVICE[strength.advice]]}` : ""}
      </p>
    </div>
  );
}
