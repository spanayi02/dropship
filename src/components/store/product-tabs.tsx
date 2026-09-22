"use client";

import { useState } from "react";
import { Star, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewForm } from "./review-form";
import { useI18n } from "@/lib/i18n/client";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerified: boolean;
  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface ProductTabsProps {
  product: {
    id: string;
    slug: string;
    description: string;
    reviews: Review[];
  };
  existingReview?: {
    id: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
  } | null;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < rating
              ? "fill-warning text-warning"
              : "fill-muted text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const { t } = useI18n();
  const initials = (review.user.name ?? "U")
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(review.createdAt));

  return (
    <div className="flex gap-4 py-5 border-b border-border last:border-0">
      {/* Avatar */}
      <div className="flex-none h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-sm font-semibold">{review.user.name ?? "Anonymous"}</span>
          {review.isVerified && (
            <span className="label-sign inline-flex items-center gap-1 rounded-md bg-go/15 px-1.5 py-0.5 text-go">
              <BadgeCheck className="h-3 w-3" />
              {t("home.verified")}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{date}</span>
        </div>

        <StarRow rating={review.rating} />

        {review.title && (
          <p className="mt-1.5 text-sm font-semibold">{review.title}</p>
        )}
        {review.comment && (
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {review.comment}
          </p>
        )}
      </div>
    </div>
  );
}

function RatingSummary({ reviews }: { reviews: Review[] }) {
  const { t } = useI18n();
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 p-6 rounded-xl bg-muted/50 border border-border mb-6">
      {/* Overall */}
      <div className="flex flex-col items-center justify-center gap-1 min-w-[80px]">
        <span className="tnum text-5xl font-bold text-foreground">
          {avg.toFixed(1)}
        </span>
        <StarRow rating={Math.round(avg)} />
        <span className="text-xs tnum text-muted-foreground mt-0.5">
          {reviews.length === 1 ? t("product.reviewCountOne") : t("product.reviewCount", { count: reviews.length })}
        </span>
      </div>

      {/* Bar chart */}
      <div className="flex-1 space-y-1.5">
        {counts.map(({ star, count }) => {
          const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2.5 text-xs tnum">
              <span className="w-3 text-right text-muted-foreground">{star}</span>
              <Star className="h-3 w-3 fill-warning text-warning flex-none" />
              <div className="flex-1 h-1.5 rounded-sm bg-border overflow-hidden">
                <div
                  className="h-full rounded-sm bg-warning transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-5 text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const useTabLabels = () => {
  const { t } = useI18n();
  return [
    { id: "description" as const, label: t("product.description") },
    { id: "reviews" as const, label: t("product.reviews") },
  ];
};

type TabId = "description" | "reviews";

export function ProductTabs({ product, existingReview }: ProductTabsProps) {
  const { t } = useI18n();
  const tabs = useTabLabels();
  const [active, setActive] = useState<TabId>("description");

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border bg-muted/30">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            role="tab"
            aria-selected={active === tab.id}
            className={cn(
              "relative px-6 py-4 text-sm font-medium transition-colors",
              active === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.id === "reviews" && product.reviews.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-secondary text-[10px] font-bold text-foreground">
                {product.reviews.length > 99 ? "99+" : product.reviews.length}
              </span>
            )}
            {active === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="p-6 sm:p-8">
        {active === "description" && (
          <div
            role="tabpanel"
            className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed"
          >
            <p className="whitespace-pre-line">{product.description}</p>
          </div>
        )}

        {active === "reviews" && (
          <div role="tabpanel" className="space-y-8">
            {product.reviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium text-foreground">{t("products.noReviews")}</p>
                <p className="text-sm mt-1">Be the first to review this product.</p>
              </div>
            ) : (
              <>
                <RatingSummary reviews={product.reviews} />
                <div className="divide-y divide-border">
                  {product.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </>
            )}
            <ReviewForm
              productId={product.id}
              productSlug={product.slug}
              existingReview={existingReview}
            />
          </div>
        )}
      </div>
    </div>
  );
}
