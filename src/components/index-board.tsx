"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";

import { CheckIcon, LeafMark, MapPinIcon } from "@/components/ui/icons";

type BoardStyle = CSSProperties & { "--board-x"?: string; "--board-y"?: string };

export type IndexRecord = { value: string; label: string };

export function IndexBoard({
  records,
  verifiedChip,
  districtChip,
}: {
  records: readonly [IndexRecord, IndexRecord, IndexRecord];
  verifiedChip: string;
  districtChip: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const next = useRef({ x: 0, y: 0 });

  // Only the two custom properties are written, and only inside one animation
  // frame, so the handler never reads layout and cannot cause a reflow.
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
      current.style.setProperty("--board-x", next.current.x.toFixed(3));
      current.style.setProperty("--board-y", next.current.y.toFixed(3));
    });
  }, []);

  const leave = useCallback(() => {
    ref.current?.style.setProperty("--board-x", "0");
    ref.current?.style.setProperty("--board-y", "0");
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const style: BoardStyle = { "--board-x": "0", "--board-y": "0" };
  const depths = ["back", "mid", "front"] as const;

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      style={style}
      className="index-board"
      aria-hidden
    >
      <div className="index-board__glow" />
      <div className="index-board__grid" />
      <div className="index-board__horizon" />

      <div className="index-board__stack">
        {records.map((record, index) => (
          <div key={record.label} className={`index-board__card index-board__card--${depths[index]}`}>
            <b>{record.value}</b>
            <small>{record.label}</small>
          </div>
        ))}
      </div>

      <span className="index-board__chip index-board__chip--one">
        <CheckIcon className="h-3.5 w-3.5" /> {verifiedChip}
      </span>
      <span className="index-board__chip index-board__chip--two">
        <MapPinIcon className="h-3.5 w-3.5" /> {districtChip}
      </span>
      <span className="index-board__seal">
        <LeafMark />
      </span>
    </div>
  );
}
