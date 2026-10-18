"use client";

import { CreditCard } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { requestBookingAction } from "@/app/bookings/actions";
import { SlotPicker } from "@/components/bookings/slot-picker";
import { ActionFeedback } from "@/components/ui/action-feedback";
import { Field, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { LESSON_TYPES } from "@/lib/constants";
import { useBrowserTimeZone, useHydrated } from "@/lib/hooks";
import { cn, formatPrice, lessonPriceCents } from "@/lib/utils";

interface Props {
  tutorId: string;
  tutorName: string;
  hourlyRateCents: number;
  currency: string;
  durations: number[];
  languages: { code: string; name: string }[];
  signedIn: boolean;
  viewerTimeZone: string | null;
  hasTrial: boolean;
}

export function BookingWidget({ tutorId, tutorName, hourlyRateCents, currency, durations, languages, signedIn, viewerTimeZone, hasTrial }: Props) {
  const [state, action] = useActionState(requestBookingAction, null);
  const browserTz = useBrowserTimeZone();
  const hydrated = useHydrated();
  const timeZone = viewerTimeZone ?? browserTz;
  const sortedDurations = [...durations].sort((a, b) => a - b);
  const [duration, setDuration] = useState(sortedDurations.includes(50) ? 50 : sortedDurations[0]);
  const [slot, setSlot] = useState<string | null>(null);
  const lessonTypes = LESSON_TYPES.filter((t) => !(t.value === "trial" && hasTrial));
  const price = lessonPriceCents(hourlyRateCents, duration);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="tutorId" value={tutorId} />
      <input type="hidden" name="duration" value={duration} />
      <input type="hidden" name="startsAt" value={slot ?? ""} />
      <ActionFeedback state={state} />

      <Field id="lessonType" label="Lesson type">
        <Select id="lessonType" name="lessonType" defaultValue="conversation">
          {lessonTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="language" label="Language">
        <Select id="language" name="language" defaultValue={languages[0]?.code}>
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </Select>
      </Field>

      <fieldset>
        <legend className="text-sm font-medium">Duration</legend>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {sortedDurations.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={duration === d}
              onClick={() => {
                setDuration(d);
                setSlot(null);
              }}
              className={cn("rounded-xl border px-2 py-2 text-sm", duration === d ? "border-primary bg-primary-soft font-semibold text-primary" : "border-border hover:bg-muted")}
            >
              {d} min
              <span className="block text-xs font-normal text-muted-foreground">{formatPrice(lessonPriceCents(hourlyRateCents, d), currency)}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <p className="mb-1.5 text-sm font-medium">Date and time</p>
        {hydrated ? <SlotPicker tutorId={tutorId} duration={duration} timeZone={timeZone} value={slot} onChange={setSlot} /> : null}
      </div>

      <Field id="note" label="Message for the tutor (optional)" hint="Share your level and what you want to practise.">
        <Textarea id="note" name="note" maxLength={1000} rows={3} aria-describedby="note-hint" />
      </Field>

      <div className="rounded-xl bg-muted px-4 py-3 text-sm">
        <div className="flex items-center justify-between">
          <span>
            {duration} minute lesson with {tutorName.split(" ")[0]}
          </span>
          <span className="text-base font-semibold">{formatPrice(price, currency)}</span>
        </div>
        <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
          <CreditCard className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Online payments are not available yet, so nothing is charged when you book. The price is stored with your booking for when payments launch.
        </p>
      </div>

      {signedIn ? (
        <SubmitButton className="w-full" size="lg" disabled={!slot} pendingText="Sending request…">
          {slot ? "Request lesson" : "Choose a time to continue"}
        </SubmitButton>
      ) : (
        <Link href={`/login?next=${encodeURIComponent(`/tutors/${tutorId}#book`)}`} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary-hover">
          Log in to book
        </Link>
      )}
      <p className="text-center text-xs text-muted-foreground">The tutor confirms or declines your request. You will get a notification either way.</p>
    </form>
  );
}
