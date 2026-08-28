import type { ComponentPropsWithoutRef, ReactNode } from "react";

const control =
  "mt-1.5 w-full rounded-xl border border-bark-200 bg-white/80 px-3.5 py-2.5 " +
  "shadow-inner transition-[border-color,box-shadow] duration-200 " +
  "placeholder:text-bark-600/55 hover:border-bark-200 " +
  "focus:border-marigold-400 focus:bg-white focus:outline-none " +
  "focus:ring-4 focus:ring-marigold-400/25";

function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="flex items-baseline justify-between gap-2">
      <span className="text-sm font-semibold text-bark-900">{children}</span>
      {hint ? <span className="text-xs text-bark-600">{hint}</span> : null}
    </span>
  );
}

export function Field({
  label,
  hint,
  className = "",
  ...rest
}: { label: string; hint?: string } & ComponentPropsWithoutRef<"input">) {
  return (
    <label className={`block ${className}`}>
      <Label hint={hint}>{label}</Label>
      <input className={control} {...rest} />
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
