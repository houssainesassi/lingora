import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Shows a rating, or "New" when there are no verified reviews yet. */
export function RatingSummary({ rating, count, className }: { rating: number; count: number; className?: string }) {
  if (count === 0) {
    return <span className={cn("text-sm text-muted-foreground", className)}>No reviews yet</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="font-semibold">{Number(rating).toFixed(1)}</span>
      <span className="text-muted-foreground">
        ({count} review{count === 1 ? "" : "s"})
      </span>
      <span className="sr-only">Average rating {Number(rating).toFixed(1)} out of 5</span>
    </span>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex", className)} aria-label={`${value} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} aria-hidden="true" className={cn("size-4", i <= value ? "fill-amber-400 text-amber-400" : "text-border")} />
      ))}
    </span>
  );
}
