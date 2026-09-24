"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";

export type SlideTone = "blue" | "sand" | "sage" | "rose" | "ink";

export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  image: string;
  imageAlt: string;
  tone: SlideTone;
  /** Optional price chip on the image, already formatted. */
  priceNow?: string;
  priceWas?: string;
}

const TONES: Record<SlideTone, string> = {
  blue: "bg-tint-blue text-foreground",
  sand: "bg-tint-sand text-foreground",
  sage: "bg-tint-sage text-foreground",
  rose: "bg-tint-rose text-foreground",
  ink: "bg-tint-ink text-tint-ink-foreground",
};

const AUTOPLAY_MS = 6500;

const controlClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm ring-1 ring-black/5 transition-colors hover:bg-background";

/**
 * Campaign banner slider, the way most large shops open their homepage.
 *
 * The track is a native scroll-snap container, so touch swipe, trackpads and
 * keyboard scrolling work without a gesture library; the buttons and autoplay
 * just scroll it. Autoplay stops on hover, on focus, when the pause control is
 * used, and entirely for people who prefer reduced motion.
 */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const { t } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [stopped, setStopped] = useState(false);
  const reducedMotion = useReducedMotion();
  const count = slides.length;

  const goTo = useCallback(
    (target: number) => {
      const track = trackRef.current;
      if (!track || count === 0) return;
      const next = ((target % count) + count) % count;
      track.scrollTo({
        left: next * track.clientWidth,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    },
    [count, reducedMotion]
  );

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const autoplay = count > 1 && !reducedMotion && !stopped && !hovered;

  useEffect(() => {
    if (!autoplay) return;
    const id = window.setTimeout(() => goTo(index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [autoplay, index, goTo]);

  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("landing.heroLabel")}
      className="relative h-full overflow-hidden rounded-2xl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        aria-live={stopped || hovered ? "polite" : "off"}
        className="scrollbar-none flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={t("landing.slideOf", { current: i + 1, total: count })}
            aria-hidden={i !== index}
            inert={i !== index}
            className={cn(
              "relative grid h-full w-full flex-none snap-start snap-always grid-cols-1 grid-rows-[auto_minmax(0,1fr)] sm:grid-cols-[1.05fr_0.95fr] sm:grid-rows-1",
              TONES[slide.tone]
            )}
          >
            {/* Copy */}
            <div className="relative z-10 flex min-w-0 flex-col justify-center px-6 pb-2 pt-7 sm:px-10 sm:py-12 lg:px-12">
              <p
                className={cn(
                  "label-sign mb-3",
                  slide.tone === "ink" ? "text-tint-ink-foreground/70" : "text-muted-foreground"
                )}
              >
                {slide.eyebrow}
              </p>
              <h2 className="text-balance text-3xl leading-[1.05] sm:text-4xl lg:text-5xl">
                {slide.title}
              </h2>
              <p
                className={cn(
                  "mt-3 line-clamp-3 max-w-md text-sm leading-relaxed sm:mt-4 sm:line-clamp-none sm:text-base",
                  slide.tone === "ink" ? "text-tint-ink-foreground/75" : "text-muted-foreground"
                )}
              >
                {slide.text}
              </p>
              <div className="mt-6 sm:mt-8">
                <Link
                  href={slide.href}
                  className={cn(
                    "inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-semibold transition-transform active:scale-[0.98]",
                    slide.tone === "ink"
                      ? "bg-tint-ink-foreground text-tint-ink hover:opacity-90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {slide.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Product */}
            <div className="relative flex min-h-0 items-center justify-center px-6 pb-14 pt-4 sm:px-8 sm:py-10 lg:pr-12">
              <Link
                href={slide.href}
                tabIndex={-1}
                aria-hidden="true"
                className="relative block aspect-square h-full max-h-[220px] overflow-hidden sm:h-auto sm:max-h-none sm:w-full rounded-2xl bg-background shadow-[0_24px_48px_-24px_rgb(0_0_0/0.35)] sm:max-w-[340px]"
              >
                <Image
                  src={slide.image}
                  alt={slide.imageAlt}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1024px) 340px, (min-width: 640px) 40vw, 220px"
                  className="object-cover"
                />
              </Link>
              {slide.priceNow && (
                <div className="absolute bottom-14 right-6 rounded-xl bg-background px-3.5 py-2 text-foreground shadow-lg sm:bottom-auto sm:top-10 lg:right-10">
                  <p className="text-base font-semibold leading-tight tabular-nums">{slide.priceNow}</p>
                  {slide.priceWas && (
                    <p className="text-xs text-muted-foreground line-through tabular-nums">
                      {slide.priceWas}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-between px-6 sm:px-10 lg:px-12">
          <div className="flex items-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={t("landing.slideOf", { current: i + 1, total: count })}
                aria-current={i === index}
                className="flex h-6 items-center"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-all duration-300",
                    i === index ? "w-6" : "w-1.5",
                    slides[index]?.tone === "ink"
                      ? i === index
                        ? "bg-tint-ink-foreground"
                        : "bg-tint-ink-foreground/35"
                      : i === index
                        ? "bg-foreground"
                        : "bg-foreground/25"
                  )}
                />
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-1.5 sm:flex">
            <button
              type="button"
              onClick={() => setStopped((s) => !s)}
              aria-label={stopped ? t("landing.play") : t("landing.pause")}
              className={controlClass}
            >
              {stopped ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label={t("landing.prevSlide")}
              className={controlClass}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label={t("landing.nextSlide")}
              className={controlClass}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
