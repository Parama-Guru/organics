"use client";

import { useEffect } from "react";

/**
 * The seller and staff workspaces sit outside /[lang] and have no dictionary,
 * so this is Tamil-first like the rest of those screens.
 */
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
      <h1 className="font-display text-3xl text-bark-900">பக்கம் ஏற்றப்படவில்லை</h1>
      <p className="mt-4 leading-relaxed text-bark-600">
        எங்கள் பக்கத்தில் ஒரு கோளாறு. பொதுவாக இது தற்காலிகமானது — மீண்டும் முயற்சிக்கவும்.
      </p>
      <button
        type="button"
        onClick={reset}
        className="focus-ring mt-6 min-h-12 rounded-full bg-marigold-500 px-6 font-medium text-on-action"
      >
        மீண்டும் முயற்சிக்க
      </button>
      {error.digest ? (
        <p className="rule-label mt-6 text-bark-600">குறிப்பு {error.digest}</p>
      ) : null}
    </div>
  );
}
