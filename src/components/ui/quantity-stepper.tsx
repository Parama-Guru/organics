"use client";

import { useId } from "react";

type Props = {
  value: number;
  min?: number;
  max?: number;
  label: string;
  onChange: (next: number) => void;
  name?: string;
};

// Replaces `input[type=number]`: the native spinner arrows are ~10px tall, which
// is unusable on touch and looks unfinished on desktop.
export function QuantityStepper({
  value,
  min = 1,
  max = 50,
  label,
  onChange,
  name,
}: Props) {
  const id = useId();
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className="inline-flex items-center rounded-full border border-bark-200 bg-white p-1 shadow-soft">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg leading-none text-bark-900 transition-colors hover:bg-marigold-100 disabled:opacity-35 disabled:hover:bg-transparent"
      >
        <span aria-hidden>&minus;</span>
      </button>

      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={label}
        value={value}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          if (digits === "") return;
          onChange(clamp(Number(digits)));
        }}
        className="w-10 border-0 bg-transparent text-center font-medium tabular-nums outline-none focus-visible:rounded-md focus-visible:outline-2"
      />

      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg leading-none text-bark-900 transition-colors hover:bg-marigold-100 disabled:opacity-35 disabled:hover:bg-transparent"
      >
        <span aria-hidden>+</span>
      </button>
    </div>
  );
}
