"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface DescriptionToggleProps {
  text: string;
  clampLines?: number;
}

export function DescriptionToggle({ text, clampLines = 3 }: DescriptionToggleProps) {
  const [expanded, setExpanded] = useState(false);

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
          className="mt-1.5 text-sm font-medium text-[var(--emerald)] hover:underline transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
