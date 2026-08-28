"use client";

import Image from "next/image";
import { useState } from "react";

type Shot = { id: string; url: string; alt: string | null };

type Props = {
  images: Shot[];
  name: string;
  emoji: string | null;
};

export function ProductGallery({ images, name, emoji }: Props) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl bg-leaf-50 text-7xl sm:h-80 sm:text-8xl">
        <span aria-hidden>{emoji ?? "\u{1F331}"}</span>
      </div>
    );
  }

  const current = images[active];

  return (
    <div>
      <div className="relative h-64 overflow-hidden rounded-3xl bg-leaf-50 sm:h-80">
        {images.map((shot, index) => (
          <Image
            key={shot.id}
            src={shot.url}
            alt={shot.alt ?? name}
            fill
            priority={index === 0}
            sizes="(max-width: 640px) 100vw, 50vw"
            // All frames stay mounted and cross-fade, so switching never flashes
            // an empty box while the next file loads.
            className={`object-cover transition-opacity duration-300 ease-out ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      {images.length > 1 ? (
        <div
          role="tablist"
          aria-label={`${name} images`}
          className="mt-3 flex flex-wrap gap-3"
        >
          {images.map((shot, index) => (
            <button
              key={shot.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              onClick={() => setActive(index)}
              className={`relative h-16 w-20 overflow-hidden rounded-xl border-2 transition-all duration-200 hover:-translate-y-0.5 ${
                index === active
                  ? "border-marigold-500 shadow-md"
                  : "border-bark-200 opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={shot.url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {current.alt ?? `${name} image ${active + 1}`}
      </p>
    </div>
  );
}
