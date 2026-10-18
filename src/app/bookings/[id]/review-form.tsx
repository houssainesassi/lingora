"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";

import { submitReviewAction } from "@/app/bookings/actions";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(submitReviewAction, null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (state?.ok) return <Alert tone="success">{state.message}</Alert>;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <ActionFeedback state={state} />
      <fieldset>
        <legend className="text-sm font-medium">Your rating</legend>
        <div className="mt-1 flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-md p-0.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} className="sr-only" checked={rating === n} onChange={() => setRating(n)} />
              <Star aria-hidden="true" className={cn("size-7", n <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-border")} />
              <span className="sr-only">
                {n} star{n > 1 ? "s" : ""}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field id="comment" label="Your review (optional)" hint="What did you practise? How did the tutor help you?">
        <Textarea id="comment" name="comment" maxLength={2000} rows={4} aria-describedby="comment-hint" />
      </Field>
      <SubmitButton disabled={rating === 0} pendingText="Submitting…">
        Submit review
      </SubmitButton>
    </form>
  );
}
