"use client";

import { useCallback, useEffect, useRef, type ElementType, type ReactNode } from "react";

type Props = {
  as?: "div" | "section" | "article" | "aside" | "li";
  surface?: "panel" | "card";
  className?: string;
  children: ReactNode;
} & React.HTMLAttributes<HTMLElement>;

/**
 * Glass panel whose sheen follows the pointer.
 *
 * The handler writes two CSS custom properties and nothing else — no state, no
 * re-render — and coalesces into one rAF frame, so moving across a grid of these
 * costs one style recalculation per frame rather than one per event.
 */
export function GlassPanel({
  as = "div",
  surface = "panel",
  className = "",
  children,
  ...rest
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef(0);
  const next = useRef({ x: 0, y: 0 });

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    // Coarse pointers report a position on tap and then leave it there, which
    // would pin the highlight in place until the next tap.
    if (event.pointerType !== "mouse") return;

    const node = ref.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    next.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };

    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--mx", `${next.current.x}px`);
      el.style.setProperty("--my", `${next.current.y}px`);
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // One cast: a ref cannot be typed across a union of tag names, and the
  // alternative is a separate component per element.
  const Tag = as as ElementType;

  return (
    <Tag
      ref={ref}
      onPointerMove={onPointerMove}
      className={`${surface === "card" ? "glass-card" : "glass"} glass-interactive ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
