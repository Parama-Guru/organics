import Image from "next/image";

/**
 * One image treatment for the whole catalogue.
 *
 * Every piece of artwork here is full-bleed and carries its own background
 * colour, so a grid of raw <img> reads as clashing rectangles. The frame adds a
 * consistent ring, top light and foot shade, holds the aspect ratio steady so
 * the grid never jumps, and gives the picture somewhere to move on hover.
 */
export function ImageField({
  src,
  alt,
  sizes,
  priority = false,
  tone = "paper",
  fallbackLabel,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  tone?: "paper" | "ink";
  /** Drawn on the plate when there is no artwork at all. */
  fallbackLabel: string;
  className?: string;
}) {
  return (
    <span className={`specimen ${tone === "ink" ? "specimen--ink" : ""} block ${className}`}>
      {src ? (
        <span className="specimen__art block">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            className="object-cover"
          />
        </span>
      ) : (
        <>
          <span aria-hidden className="specimen__plate" />
          <span className="absolute inset-0 z-3 flex items-center justify-center">
            <span className={`rule-label ${tone === "ink" ? "text-bark-50/70" : "text-bark-600"}`}>
              {fallbackLabel}
            </span>
          </span>
        </>
      )}
    </span>
  );
}
