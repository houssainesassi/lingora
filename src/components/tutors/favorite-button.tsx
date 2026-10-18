"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";

import { toggleFavoriteAction } from "@/app/tutors/actions";
import { cn } from "@/lib/utils";

export function FavoriteButton({ tutorId, tutorName, initial, className, withLabel }: { tutorId: string; tutorName: string; initial: boolean; className?: string; withLabel?: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = () =>
    startTransition(async () => {
      const next = !optimistic;
      setOptimistic(next);
      const res = await toggleFavoriteAction(tutorId, next);
      if (!res.ok) {
        if (res.needsLogin) {
          router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }
        toast.error(res.message);
        return;
      }
      setSaved(res.favorited);
      toast.success(res.favorited ? `${tutorName} added to favorites` : `${tutorName} removed from favorites`);
    });

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={optimistic}
      aria-label={optimistic ? `Remove ${tutorName} from favorites` : `Add ${tutorName} to favorites`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-sm transition-colors hover:bg-muted disabled:opacity-60",
        withLabel ? "h-10 px-3" : "size-10 justify-center",
        className,
      )}
    >
      <Heart aria-hidden="true" className={cn("size-4", optimistic ? "fill-accent text-accent" : "text-muted-foreground")} />
      {withLabel ? <span>{optimistic ? "Saved" : "Save"}</span> : null}
    </button>
  );
}
