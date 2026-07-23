"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface SlideshowProps {
  images: string[];
  interval?: number;
}

export function Slideshow({ images, interval = 3000 }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images, interval]);

  return (
    <div className="relative w-full h-full">
      {images.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={`Preview ${index + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`object-cover absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
