"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Flame, ChevronRight } from "lucide-react";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const STATS = [
  { value: "10K+", label: "Products" },
  { value: "50K+", label: "Happy Customers" },
  { value: "4.9★", label: "Average Rating" },
];

export function AnimatedHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "oklch(0.11 0.04 155)" }}
    >
      {/* Grid pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, oklch(1 0 0 / 6%) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(1 0 0 / 6%) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* Primary glow — emerald, top-center */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full blur-[100px]"
        style={{ background: "oklch(0.55 0.20 155)" }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 0.25, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      {/* Secondary glow — violet, bottom-right */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full blur-[120px]"
        style={{ background: "oklch(0.55 0.22 280)" }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 0.20, scale: 1 }}
        transition={{ duration: 1.6, ease: "easeOut", delay: 0.2 }}
      />
      {/* Tertiary glow — cyan, bottom-left */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full blur-[100px]"
        style={{ background: "oklch(0.60 0.18 200)" }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
      />

      <motion.div
        className="relative z-10 mx-auto max-w-5xl px-4 py-28 sm:py-40 text-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Badge */}
        <motion.span
          variants={item}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-xs font-semibold text-white/90 mb-8 backdrop-blur-sm"
          style={{ backgroundColor: "oklch(1 0 0 / 8%)" }}
        >
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          Flash sale — new deals every day
        </motion.span>

        {/* Heading */}
        <motion.h1
          variants={item}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6 text-white"
          style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}
        >
          Discover Products{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, oklch(0.75 0.20 155) 0%, oklch(0.80 0.16 185) 50%, oklch(0.75 0.20 220) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            You&apos;ll Love
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={item}
          className="mx-auto max-w-xl text-base sm:text-lg mb-10"
          style={{ color: "oklch(0.85 0 0)" }}
        >
          Curated top-quality products delivered fast and direct to your door.
          From electronics to fashion — find it all here.
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.03] hover:shadow-xl active:scale-100"
            style={{
              background: "linear-gradient(135deg, oklch(0.52 0.18 155) 0%, oklch(0.50 0.20 175) 100%)",
              boxShadow: "0 0 30px oklch(0.52 0.18 155 / 40%)",
            }}
          >
            Shop Now
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/products?sale=true"
            className="inline-flex items-center gap-2 rounded-xl border px-7 py-3.5 text-sm font-semibold text-white/90 transition-all hover:bg-white/10 active:scale-[0.98]"
            style={{ borderColor: "oklch(1 0 0 / 20%)" }}
          >
            View Deals
            <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={item}
          className="mt-14 flex items-center justify-center divide-x divide-white/10 max-w-lg mx-auto"
        >
          {STATS.map((stat, i) => (
            <div key={stat.label} className="flex-1 text-center px-4">
              <div
                className="text-2xl sm:text-3xl font-extrabold"
                style={{
                  fontFamily: "var(--font-heading), system-ui, sans-serif",
                  background: "linear-gradient(135deg, oklch(0.80 0.18 155), oklch(0.85 0.14 185))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {stat.value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "oklch(0.65 0 0)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Fade to page background at the bottom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--background))",
        }}
      />
    </section>
  );
}
