"use client";

import Image from "next/image";
import { useState, useMemo } from "react";

type Props = {
  images: string[];     // sempre um array (se vier só 1, ok)
  alt: string;
  className?: string;
  thumbSize?: number;   // px (default 80)
};

const PLACEHOLDER = "/placeholder.png";

export default function Gallery({ images, alt, className = "", thumbSize = 80 }: Props) {
  const safeImages = useMemo(
    () => (Array.isArray(images) && images.length ? images : [PLACEHOLDER]),
    [images]
  );

  const [active, setActive] = useState(safeImages[0]);

  return (
    <div className={`w-full flex flex-col items-center gap-4 ${className}`}>
      {/* principal */}
      <div className="w-full bg-gray-50 rounded shadow flex items-center justify-center">
        <Image
          src={active}
          alt={alt}
          width={800}
          height={800}
          priority
          className="rounded object-contain max-h-[420px] w-full"
          onError={() => setActive(PLACEHOLDER)}
        />
      </div>

      {/* thumbs */}
      {safeImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto justify-center w-full">
          {safeImages.map((src, i) => (
            <button
              key={`${src}-${i}`}
              onClick={() => setActive(src)}
              aria-label={`Ver imagem ${i + 1}`}
              className={`rounded border-2 overflow-hidden transition ${
                active === src ? "border-[#2F7E7F]" : "border-transparent hover:border-gray-300"
              }`}
              style={{ width: thumbSize + 4, height: thumbSize + 4 }}
            >
              <Image
                src={src}
                alt={`thumb-${i + 1}`}
                width={thumbSize}
                height={thumbSize}
                className="rounded object-cover"
                onError={(e) => ((e.currentTarget as HTMLImageElement).src = PLACEHOLDER)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
