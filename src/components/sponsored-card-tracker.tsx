"use client";

import { useEffect, useRef, type ReactNode } from "react";

type EventType = "IMPRESSION" | "CLICK";

function send(placementId: string, event: EventType): void {
  void fetch("/api/sponsorships/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placementId, event }),
    keepalive: true,
  }).catch(() => undefined);
}

/**
 * Counts only aggregate visibility and engagement. No visitor identifier is
 * created; the server stores one total per placement per India calendar day.
 */
export function SponsoredCardTracker({
  placementId,
  children,
}: {
  placementId: string | null;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const impressionSent = useRef(false);
  const clickSent = useRef(false);

  useEffect(() => {
    if (!placementId || impressionSent.current) return;
    const node = ref.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      impressionSent.current = true;
      send(placementId, "IMPRESSION");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || impressionSent.current) return;
        impressionSent.current = true;
        send(placementId, "IMPRESSION");
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [placementId]);

  function captureClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!placementId || clickSent.current) return;
    const target = event.target;
    if (!(target instanceof Element) || !target.closest("a, button")) return;
    clickSent.current = true;
    send(placementId, "CLICK");
  }

  return (
    <div ref={ref} onClickCapture={captureClick} className="h-full">
      {children}
    </div>
  );
}
