import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

export function GoogleSignIn({
  locale,
  next,
  label,
  passwordLabel,
  intent = "sign-in",
}: {
  locale: Locale;
  next: string;
  label: string;
  passwordLabel?: string;
  intent?: "sign-in" | "link";
}) {
  const query = new URLSearchParams({ locale, next });

  const content = (
    <>
      <span
        aria-hidden
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white font-sans text-sm font-bold text-[#4285f4] ring-1 ring-bark-200"
      >
        G
      </span>
      {label}
    </>
  );

  if (intent === "link") {
    return (
      <form action={`/api/auth/google?${query}`} method="post" className="grid gap-3">
        <input type="hidden" name="operation" value="link" />
        <label className="grid gap-1 text-sm font-medium text-bark-900">
          {passwordLabel}
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            maxLength={200}
            className="min-h-11 rounded-xl border border-bark-200 bg-white px-3 text-base shadow-inner outline-none focus:border-leaf-500 focus:ring-2 focus:ring-leaf-200"
          />
        </label>
        <Button type="submit" variant="secondary" size="lg" className="w-full">
          {content}
        </Button>
      </form>
    );
  }

  return (
    <Button
      as="a"
      href={`/api/auth/google?${query}`}
      variant="secondary"
      size="lg"
      className="w-full"
    >
      {content}
    </Button>
  );
}
