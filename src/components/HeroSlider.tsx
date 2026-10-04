"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LogoMark } from "./Logo";

function ToothpasteBox({ color, flavour }: { color: string; flavour: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative z-10 h-[110px] w-[40px] overflow-hidden rounded-[3px] bg-white shadow-xl sm:h-[190px] sm:w-[68px] lg:h-[260px] lg:w-[92px]">
        <span
          className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-black tracking-[0.2em] [writing-mode:vertical-rl] sm:top-3 sm:text-2xl lg:text-[34px]"
          style={{ color }}
        >
          RADIUS
        </span>
        <span className="absolute top-[52%] left-1/2 grid size-5 -translate-x-1/2 place-items-center rounded-full border-2 border-leaf bg-white text-[4px] leading-none font-black text-leaf sm:size-9 sm:text-[7px] lg:size-11 lg:text-[8px]">
          USDA
        </span>
        <div
          className="absolute inset-x-0 bottom-0 flex h-[30%] items-center justify-center px-1 text-center text-[5px] leading-tight font-bold text-white sm:text-[9px] lg:text-[11px]"
          style={{ background: color }}
        >
          {flavour}
        </div>
      </div>
      <div className="-mt-3 h-6 w-24 rounded-[50%] bg-gradient-to-b from-white to-gray-200 shadow-lg sm:-mt-5 sm:h-10 sm:w-40 lg:h-14 lg:w-56" />
    </div>
  );
}

function DiscountSlide() {
  return (
    <div
      className="relative flex h-full items-center justify-between px-[6%]"
      style={{
        background:
          "linear-gradient(90deg,#e48693 0%,#f4d4d8 20%,#ffffff 42%,#ffffff 58%,#cdeeea 80%,#3dbfb6 100%)",
      }}
    >
      <div className="absolute top-3 -left-9 w-36 -rotate-45 bg-white/90 py-0.5 text-center text-[10px] font-black tracking-wide text-[#c8102e] shadow sm:top-6 sm:-left-12 sm:w-52 sm:py-1.5 sm:text-lg lg:top-9 lg:-left-14 lg:w-64 lg:text-2xl">
        ORDER NOW
      </div>
      <div className="absolute top-3 right-3 rounded-lg bg-white p-1 shadow sm:top-4 sm:right-4 sm:p-2">
        <LogoMark className="h-5 w-7 sm:h-8 sm:w-11" />
      </div>

      <ToothpasteBox color="#d0213f" flavour="Clove Cardamom" />
      <div className="text-center font-bangla font-bold text-leaf">
        <p className="text-[64px] leading-none sm:text-[120px] lg:text-[180px]">১০%</p>
        <p className="mt-1 text-xl sm:text-4xl lg:text-6xl">ডিসকাউন্ট*</p>
      </div>
      <ToothpasteBox color="#12a39b" flavour="Mint Aloe Neem" />
    </div>
  );
}

function TextSlide({
  eyebrow,
  title,
  subtitle,
  emojis,
  background,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  emojis: string[];
  background: string;
}) {
  return (
    <div className="flex h-full items-center justify-between gap-4 px-6 sm:px-12 lg:px-20" style={{ background }}>
      <div className="max-w-xl">
        <p className="text-xs font-bold tracking-wider text-brand-dark uppercase sm:text-sm">{eyebrow}</p>
        <h2 className="mt-2 text-2xl leading-tight font-bold text-heading sm:text-4xl lg:text-6xl">{title}</h2>
        <p className="mt-2 hidden text-body sm:block lg:mt-4 lg:text-lg">{subtitle}</p>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-xs font-bold text-white transition hover:bg-brand-dark sm:mt-6 sm:px-7 sm:py-3 sm:text-sm"
        >
          Shop Now
        </Link>
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-1 text-4xl sm:gap-3 sm:text-6xl lg:text-8xl">
        {emojis.map((e) => (
          <span key={e}>{e}</span>
        ))}
      </div>
    </div>
  );
}

const slides = [
  <DiscountSlide key="discount" />,
  <TextSlide
    key="fresh"
    eyebrow="100% Organic & Natural"
    title="Healthy food for a healthy life"
    subtitle="Certified organic oils, seeds, honey and more — delivered across Bangladesh."
    emojis={["🍯", "🌱", "🥥", "🌾"]}
    background="linear-gradient(110deg,#eef8e6 0%,#ffffff 55%,#d9f2ee 100%)"
  />,
  <TextSlide
    key="delivery"
    eyebrow="Fast home delivery"
    title="Your daily needs, at your door"
    subtitle="Order before 5 PM for next-day delivery inside Dhaka."
    emojis={["🚚", "🧂", "☕", "🌾"]}
    background="linear-gradient(110deg,#fff5e6 0%,#ffffff 55%,#e2f4f3 100%)"
  />,
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((dir: number) => {
    setIndex((i) => (i + dir + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [go, paused]);

  return (
    <section
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative h-[190px] overflow-hidden rounded-2xl sm:h-[320px] lg:h-[520px]"
    >
      <div
        className="flex h-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="h-full w-full shrink-0" aria-hidden={i !== index}>
            {slide}
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous slide"
        onClick={() => go(-1)}
        className="absolute top-1/2 left-2 hidden size-10 -translate-y-1/2 place-items-center rounded-full text-white/80 transition hover:bg-white/30 hover:text-white sm:grid lg:left-12"
      >
        <ChevronLeft className="size-7" />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={() => go(1)}
        className="absolute top-1/2 right-2 hidden size-10 -translate-y-1/2 place-items-center rounded-full text-white/80 transition hover:bg-white/30 hover:text-white sm:grid lg:right-12"
      >
        <ChevronRight className="size-7" />
      </button>

      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 sm:bottom-4">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-brand" : "w-2 bg-heading/20"}`}
          />
        ))}
      </div>
    </section>
  );
}
