"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";

import { CheckIcon, LeafMark, MapPinIcon } from "@/components/ui/icons";

type WorldStyle = CSSProperties & { "--farm-x"?: string; "--farm-y"?: string };

export function FarmWorld({
  checkedLabel,
  districtLabel,
  directLabel,
}: {
  checkedLabel: string;
  districtLabel: string;
  directLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const next = useRef({ x: 0, y: 0 });

  const move = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    next.current = {
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
    };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const current = ref.current;
      if (!current) return;
      current.style.setProperty("--farm-x", next.current.x.toFixed(3));
      current.style.setProperty("--farm-y", next.current.y.toFixed(3));
    });
  }, []);

  const leave = useCallback(() => {
    ref.current?.style.setProperty("--farm-x", "0");
    ref.current?.style.setProperty("--farm-y", "0");
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const style: WorldStyle = { "--farm-x": "0", "--farm-y": "0" };

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      style={style}
      className="farm-world"
      aria-hidden
    >
      <div className="farm-world__sky" />
      <div className="farm-world__sun" />
      <div className="farm-world__cloud farm-world__cloud--one" />
      <div className="farm-world__cloud farm-world__cloud--two" />

      <svg className="farm-world__mountains farm-world__mountains--far" viewBox="0 0 800 300" preserveAspectRatio="none">
        <path d="M0 260 120 126 230 224 355 76 475 218 604 110 800 258V300H0Z" fill="#8eb39a" />
        <path d="m305 130 50-54 48 83-49-29Z" fill="#f7f3e8" opacity=".75" />
        <path d="m554 164 50-54 58 86-59-35Z" fill="#f7f3e8" opacity=".65" />
      </svg>
      <svg className="farm-world__mountains farm-world__mountains--near" viewBox="0 0 800 250" preserveAspectRatio="none">
        <path d="M0 235 134 130 254 220 386 102 510 224 644 118 800 224V250H0Z" fill="#4f7e59" />
        <path d="M0 240 174 174 312 236 484 154 620 230 800 170V250H0Z" fill="#386846" />
      </svg>

      <div className="farm-world__field farm-world__field--back" />
      <div className="farm-world__path" />
      <div className="farm-world__field farm-world__field--left">
        {Array.from({ length: 7 }, (_, index) => (
          <span key={index} style={{ "--row": index } as CSSProperties} />
        ))}
      </div>
      <div className="farm-world__field farm-world__field--right">
        {Array.from({ length: 7 }, (_, index) => (
          <span key={index} style={{ "--row": index } as CSSProperties} />
        ))}
      </div>

      <div className="farm-world__house">
        <span className="farm-world__roof" />
        <span className="farm-world__wall" />
        <span className="farm-world__door" />
        <span className="farm-world__window" />
      </div>
      <div className="farm-world__tree farm-world__tree--one"><span /><i /></div>
      <div className="farm-world__tree farm-world__tree--two"><span /><i /></div>
      <div className="farm-world__tree farm-world__tree--three"><span /><i /></div>

      <div className="farm-world__crop-front">
        {Array.from({ length: 14 }, (_, index) => (
          <span
            key={index}
            style={{
              "--stalk": index,
              "--stalk-height": `${2.9 + (index % 4) * 0.5}rem`,
            } as CSSProperties}
          >
            <i /><b />
          </span>
        ))}
      </div>

      <div className="farm-world__card farm-world__card--verify">
        <span className="farm-world__card-icon"><CheckIcon /></span>
        <span><b>100%</b><small>{checkedLabel}</small></span>
      </div>
      <div className="farm-world__card farm-world__card--place">
        <MapPinIcon />
        <span><b>{districtLabel}</b><small>{directLabel}</small></span>
      </div>
      <div className="farm-world__seal"><LeafMark /></div>
    </div>
  );
}
