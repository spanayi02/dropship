"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";

interface DescriptionToggleProps {
  text: string;
  clampLines?: number;
}

export function DescriptionToggle({ text, clampLines = 3 }: DescriptionToggleProps) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useI18n();

  // Heuristic: check if text is long enough to need clamping
  const needsClamping = text.length > 200;

  return (
    <div>
      <p
        className={cn(
          "text-sm leading-relaxed text-muted-foreground whitespace-pre-line transition-all",
          !expanded && needsClamping
            ? clampLines === 3
              ? "line-clamp-3"
              : "line-clamp-4"
            : ""
        )}
      >
        {text}
      </p>
      {needsClamping && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-sm font-semibold text-ink dark:text-signal hover:underline transition-colors"
        >
          {expanded ? t("product.readLess") : t("product.readMore")}
        </button>
      )}
    </div>
  );
}
