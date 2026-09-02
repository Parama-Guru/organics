import type { ReactNode } from "react";

type Tone = "leaf" | "marigold" | "indigo" | "neutral";

const tones: Record<Tone, string> = {
  leaf: "bg-leaf-100 text-leaf-800 ring-leaf-300/60",
  marigold: "bg-marigold-100 text-bark-900 ring-marigold-400/60",
  indigo: "bg-bark-900 text-bark-50 ring-bark-900/20",
  neutral: "bg-white/70 text-bark-600 ring-bark-200",
};

export function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.08em] ring-1 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
