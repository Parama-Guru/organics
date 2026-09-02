"use client";

import { useEffect, useRef } from "react";

/**
 * A ring that trails the pointer and widens over anything interactive.
 *
 * Purely decorative, so it is skipped entirely on coarse pointers and under
 * reduced motion, and it never captures events. Position is written straight to
 * the node inside a rAF rather than through state, because a re-render per
 * mousemove would be about sixty renders a second.
 */
export function CursorCompanion() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || calm.matches) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    let pointerX = 0;
    let pointerY = 0;
    let ringX = 0;
    let ringY = 0;
    let frame = 0;
    let started = false;

    const draw = () => {
      // The ring eases toward the pointer; the dot tracks it exactly.
      ringX += (pointerX - ringX) * 0.18;
      ringY += (pointerY - ringY) * 0.18;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      dot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
      frame = requestAnimationFrame(draw);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (!started) {
        started = true;
        ringX = pointerX;
        ringY = pointerY;
        ring.dataset.active = "true";
        dot.dataset.active = "true";
        frame = requestAnimationFrame(draw);
      }

      const target = event.target as Element | null;
      const hot = Boolean(
        target?.closest?.('a, button, [role="button"], input, select, textarea, summary'),
      );
      ring.dataset.hot = hot ? "true" : "false";
    };

    const onLeave = () => {
      ring.dataset.active = "false";
      dot.dataset.active = "false";
    };

    const onEnter = () => {
      if (!started) return;
      ring.dataset.active = "true";
      dot.dataset.active = "true";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerenter", onEnter);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerenter", onEnter);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} aria-hidden className="cursor-ring" />
      <div ref={dotRef} aria-hidden className="cursor-dot" />
    </>
  );
}
