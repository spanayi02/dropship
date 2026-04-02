"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Star, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { submitReview } from "@/app/actions/reviews";

interface ReviewFormProps {
  productId: string;
  productSlug: string;
  existingReview?: {
    id: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
  } | null;
}

export function ReviewForm({
  productId,
  productSlug,
  existingReview,
}: ReviewFormProps) {
  const { data: session, status } = useSession();
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  // Not logged in
  if (status === "unauthenticated" || (!session && status !== "loading")) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Please{" "}
          <a
            href={`/login?callbackUrl=/products/${productSlug}`}
            className="font-medium text-[var(--emerald)] hover:underline"
          >
            log in
          </a>{" "}
          to leave a review.
        </p>
      </div>
    );
  }

  // Already reviewed
  if (existingReview) {
    return (
      <div className="rounded-xl border border-[var(--emerald)]/30 bg-[var(--emerald)]/5 px-6 py-5 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-[var(--emerald)] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">You&apos;ve already reviewed this product</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Thank you for your feedback!
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="rounded-xl border border-[var(--emerald)]/30 bg-[var(--emerald)]/5 px-6 py-5 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-[var(--emerald)] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Review submitted!</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Thank you for sharing your thoughts.
          </p>
        </div>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (selectedStar === 0) {
      toast.error("Please select a star rating");
      return;
    }

    startTransition(async () => {
      const result = await submitReview(productId, {
        rating: selectedStar,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      });

      if (result.success) {
        setSubmitted(true);
        toast.success("Review submitted successfully!");
      } else {
        toast.error(result.error ?? "Failed to submit review");
      }
    });
  }

  const displayStar = hoveredStar > 0 ? hoveredStar : selectedStar;

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-6 space-y-5">
      <h3 className="text-base font-semibold">Write a Review</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Rating <span className="text-destructive">*</span>
          </label>
          <div
            className="flex items-center gap-1"
            role="radiogroup"
            aria-label="Select rating"
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const starValue = i + 1;
              return (
                <button
                  key={starValue}
                  type="button"
                  aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
                  onClick={() => setSelectedStar(starValue)}
                  onMouseEnter={() => setHoveredStar(starValue)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  <Star
                    className={cn(
                      "h-7 w-7 transition-colors",
                      starValue <= displayStar
                        ? "fill-amber-400 text-amber-400"
                        : "fill-muted text-muted-foreground/30"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="review-title" className="text-sm font-medium">
            Title{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarise your experience"
            maxLength={120}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-all"
          />
        </div>

        {/* Comment */}
        <div className="space-y-1.5">
          <label htmlFor="review-comment" className="text-sm font-medium">
            Comment{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell others what you think about this product…"
            rows={4}
            maxLength={1000}
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none transition-all"
          />
        </div>

        <Button type="submit" disabled={isPending || selectedStar === 0}>
          {isPending ? "Submitting…" : "Submit Review"}
        </Button>
      </form>
    </div>
  );
}
