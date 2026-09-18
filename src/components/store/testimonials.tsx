"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Star, Quote } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";

export interface Testimonial {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerified: boolean;
  authorName: string;
  productTitle: string;
  productSlug: string;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export function Testimonials({ reviews }: { reviews: Testimonial[] }) {
  const { t } = useI18n();
  if (reviews.length === 0) return null;

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {reviews.map((review) => (
        <motion.div
          key={review.id}
          variants={item}
          className="flex flex-col rounded-[4px] border border-border bg-card p-5"
        >
          <Quote className="h-5 w-5 text-ink/30 dark:text-signal/50 mb-3" />

          <div className="flex items-center gap-0.5 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={
                  i < review.rating
                    ? "h-3.5 w-3.5 fill-signal-deep text-signal-deep"
                    : "h-3.5 w-3.5 fill-muted text-muted-foreground/30"
                }
              />
            ))}
          </div>

          {review.title && (
            <p className="text-sm font-semibold text-foreground mb-1">{review.title}</p>
          )}
          {review.comment && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 mb-4">
              {review.comment}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-foreground">{review.authorName}</span>
              {review.isVerified && (
                <span className="label-sign rounded-[2px] bg-go/15 text-go px-1.5 py-0.5">
                  {t("home.verified")}
                </span>
              )}
            </div>
            <Link
              href={`/products/${review.productSlug}`}
              className="text-xs text-muted-foreground hover:text-ink dark:hover:text-signal transition-colors truncate max-w-[45%]"
            >
              {review.productTitle}
            </Link>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
