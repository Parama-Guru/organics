"use client";

import { useEffect } from "react";

/** The staff workspace is English throughout, unlike the seller portals. */
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[portal]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <h1 className="font-display text-3xl text-bark-900">That did not load</h1>
      <p className="mt-4 leading-relaxed text-bark-600">
        Something failed at our end. It is usually momentary — try again, and check the server log
        for the reference below if it persists.
      </p>
      <button
        type="button"
        onClick={reset}
        className="focus-ring mt-6 min-h-12 rounded-full bg-marigold-500 px-6 font-medium text-on-action"
      >
        Try again
      </button>
      {error.digest ? (
        <p className="rule-label mt-6 text-bark-600">Reference {error.digest}</p>
      ) : null}
    </div>
  );
}
