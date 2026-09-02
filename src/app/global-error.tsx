"use client";

import { useEffect } from "react";

/**
 * The last resort: this replaces the whole document, so it renders its own
 * <html> and cannot rely on the layout, the theme script, the fonts or the
 * stylesheet — any of which may be what failed. Styles are inline for that
 * reason. English only, because the dictionary is loaded by the layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root]", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "#fffdf6",
          color: "#333333",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: "34rem" }}>
          <h1 style={{ margin: 0, fontSize: "2rem", lineHeight: 1.15, color: "#05162e" }}>
            OSSIL is having a moment
          </h1>
          <p style={{ marginTop: "1rem", lineHeight: 1.6 }}>
            Something failed before the page could be built. It is our end, not yours, and it is
            usually brief.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              minHeight: "3rem",
              padding: "0 1.5rem",
              borderRadius: "9999px",
              border: "none",
              background: "#ea7a21",
              color: "#05162e",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#5c5647" }}>
              Reference {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
