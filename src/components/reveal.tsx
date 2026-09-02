"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealStyle = CSSProperties & { "--reveal-delay"?: string };

export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "up" | "left" | "right" | "scale";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      node.dataset.visible = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        node.dataset.visible = "true";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const style: RevealStyle = { "--reveal-delay": `${delay}ms` };
  return (
    <div ref={ref} className={`reveal reveal-${variant} ${className}`} style={style}>
      {children}
    </div>
  );
}
