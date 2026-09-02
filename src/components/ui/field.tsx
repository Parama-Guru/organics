import type { ComponentPropsWithoutRef, ReactNode } from "react";

const control =
  "focus-ring mt-2 w-full rounded-2xl border border-bark-200 bg-canvas px-4 py-3 " +
  "placeholder:text-bark-600/55 focus:bg-paper";

// Colour alone would not carry for a colour-blind user; aria-invalid on the
// control is what the message is actually tied to.
const invalidRing = "border-red-400 bg-red-50/60";

function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="flex items-baseline justify-between gap-2">
      <span className="text-sm font-semibold text-bark-900 sm:text-[0.9375rem]">{children}</span>
      {hint ? <span className="text-sm text-bark-600">{hint}</span> : null}
    </span>
  );
}

export function Field({
  label,
  hint,
  invalid,
  error,
  className = "",
  id,
  name,
  ...rest
}: {
  label: string;
  hint?: string;
  invalid?: boolean;
  error?: string;
} & ComponentPropsWithoutRef<"input">) {
  const errorId = error ? `${id ?? name}-error` : undefined;
  return (
    <label className={`block ${className}`}>
      <Label hint={hint}>{label}</Label>
      <input
        id={id}
        name={name}
        aria-invalid={invalid || undefined}
        aria-describedby={errorId}
        className={`${control} ${invalid ? invalidRing : ""}`}
        {...rest}
      />
      {/* Next to the field it is about, not in a banner further down the form. */}
      {error ? (
        <span id={errorId} className="mt-1 block text-sm font-medium text-red-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function SelectField({
  label,
  hint,
  className = "",
  children,
  ...rest
}: { label: string; hint?: string } & ComponentPropsWithoutRef<"select">) {
  return (
    <label className={`block ${className}`}>
      <Label hint={hint}>{label}</Label>
      <select className={control} {...rest}>
        {children}
      </select>
    </label>
  );
}

export function TextareaField({
  label,
  hint,
  className = "",
  ...rest
}: { label: string; hint?: string } & ComponentPropsWithoutRef<"textarea">) {
  return (
    <label className={`block ${className}`}>
      <Label hint={hint}>{label}</Label>
      <textarea className={`${control} resize-y`} {...rest} />
    </label>
  );
}
