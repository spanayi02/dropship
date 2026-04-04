"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";

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
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const STATS = [
  { value: "10K+", label: "Products" },
  { value: "50K+", label: "Happy Customers" },
  { value: "4.9★", label: "Average Rating" },
];

export function AnimatedHero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Grid pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)",
          opacity: 0.5,
        }}
      />
      {/* Glow blob */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full blur-3xl bg-[var(--emerald)]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      <motion.div
        className="relative z-10 mx-auto max-w-5xl px-4 py-24 sm:py-32 text-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Badge */}
        <motion.span
          variants={item}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground mb-6"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--emerald)] animate-pulse" />
          New arrivals every week
        </motion.span>

        {/* Heading */}
        <motion.h1
          variants={item}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
          style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}
        >
          Discover Products{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--emerald) 0%, oklch(0.65 0.18 200) 50%, oklch(0.60 0.20 260) 100%)",
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
          className="mx-auto max-w-xl text-base sm:text-lg text-muted-foreground mb-10"
        >
          Curated selection of top-quality products, delivered fast and direct to your
          door. From electronics to fashion — find it all here.
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={item}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--emerald)] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[var(--emerald)]/25 hover:opacity-90 transition-opacity"
          >
            Shop Now
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/products?sort=price_asc"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 backdrop-blur-sm px-7 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            View Deals
            <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={item}
          className="mt-14 grid grid-cols-3 gap-6 sm:gap-8 max-w-lg mx-auto"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-2xl sm:text-3xl font-extrabold text-[var(--emerald)]"
                style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
