"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/** Horizontal scroll-snap row with prev/next arrows. Children set their own widths. */
export function Carousel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const arrow =
    "absolute top-1/2 z-10 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-white text-heading shadow-sm transition hover:bg-brand hover:text-white sm:grid";

  return (
    <div className="relative">
      <div ref={trackRef} className={`no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth ${className}`}>
        {children}
      </div>
      <button type="button" aria-label="Scroll left" onClick={() => scroll(-1)} className={`${arrow} left-3`}>
        <ArrowLeft className="size-4" />
      </button>
      <button type="button" aria-label="Scroll right" onClick={() => scroll(1)} className={`${arrow} right-3`}>
        <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
