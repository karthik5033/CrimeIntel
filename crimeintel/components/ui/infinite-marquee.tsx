"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

interface InfiniteMarqueeProps {
  images: string[];
}

export function InfiniteMarquee({ images }: InfiniteMarqueeProps) {
  // Duplicate the images array to create a seamless loop
  const duplicatedImages = [...images, ...images];

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
      <div className="flex flex-col w-full animate-marquee-vertical">
        {duplicatedImages.map((src, index) => (
          <div key={`${src}-${index}`} className="relative w-full aspect-video border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <Image
              src={src}
              alt={`App Interface Preview ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
