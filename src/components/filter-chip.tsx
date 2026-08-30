"use client";

import Link, { useLinkStatus } from "next/link";

// A filter click still costs a server round trip. This paints the new selection
// immediately so the delay reads as loading rather than as nothing happening.
function ChipBody({ active, children }: { active: boolean; children: string }) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={`relative inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ring-1 transition-all duration-200 ${
        active || pending
          ? "bg-bark-900 text-bark-50 shadow-soft ring-bark-900"
          : "bg-white text-bark-600 ring-bark-200 hover:text-bark-900 hover:ring-marigold-400"
      }`}
    >
      {children}
      {pending ? (
        <span
          aria-hidden
          className="h-3 w-3 animate-spin rounded-full border-2 border-bark-50/40 border-t-bark-50"
        />
      ) : null}
    </span>
  );
}

export function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      aria-current={active ? "true" : undefined}
      className="rounded-full transition-transform duration-200 hover:-translate-y-0.5"
    >
      <ChipBody active={active}>{children}</ChipBody>
    </Link>
  );
}
