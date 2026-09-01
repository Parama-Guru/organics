import type { ComponentPropsWithoutRef, ReactNode } from "react";

const control =
  "mt-1.5 w-full rounded-xl border border-bark-200 bg-white/80 px-3.5 py-2.5 " +
  "shadow-inner transition-[border-color,box-shadow] duration-200 " +
  "placeholder:text-bark-600/55 hover:border-bark-200 " +
  "focus:border-marigold-400 focus:bg-white focus:outline-none " +
  "focus:ring-4 focus:ring-marigold-400/25";

// Colour alone would not carry for a colour-blind user; aria-invalid on the
// control is what the message is actually tied to.
const invalidRing = "border-red-400 bg-red-50/60";

function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="flex items-baseline justify-between gap-2">
      <span className="text-sm font-semibold text-bark-900">{children}</span>
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
