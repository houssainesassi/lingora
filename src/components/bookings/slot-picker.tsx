"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const DAYS_AHEAD = 14;

interface Props {
  tutorId: string;
  duration: number;
  timeZone: string;
  value: string | null;
  onChange: (iso: string | null) => void;
  ignoreBookingId?: string;
}

/**
 * Loads bookable start times from get_tutor_slots() and shows them grouped by
 * day in the viewer's local time zone.
 */
export function SlotPicker({ tutorId, duration, timeZone, value, onChange, ignoreBookingId }: Props) {
  const [state, setState] = useState<{ key: string; slots: string[]; error: string | null } | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const key = `${tutorId}:${duration}:${ignoreBookingId ?? ""}`;

  useEffect(() => {
    let cancelled = false;
    const from = new Date();
    const to = new Date(from.getTime() + DAYS_AHEAD * 86400_000);
    createClient()
      .rpc("get_tutor_slots", {
        p_tutor_id: tutorId,
        p_from: from.toISOString(),
        p_to: to.toISOString(),
        p_duration: duration,
        p_ignore_booking: ignoreBookingId,
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({ key, slots: (data ?? []).map((r) => r.starts_at), error: error ? "Could not load availability. Please refresh." : null });
      });
    return () => {
      cancelled = true;
    };
  }, [tutorId, duration, ignoreBookingId, key]);

  const loading = !state || state.key !== key;
  const slots = useMemo(() => (loading ? [] : state.slots), [loading, state]);

  const byDay = useMemo(() => {
    const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    const map = new Map<string, string[]>();
    for (const s of slots) {
      const k = dayKey.format(new Date(s));
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return map;
  }, [slots, timeZone]);

  const days = [...byDay.keys()];
  const activeDay = day && byDay.has(day) ? day : days[0] ?? null;

  if (loading) {
    return (
      <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading availability…
      </p>
    );
  }
  if (state.error) return <p className="py-4 text-sm text-danger">{state.error}</p>;
  if (days.length === 0) {
    return <p className="rounded-xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">No open times in the next {DAYS_AHEAD} days for this lesson length.</p>;
  }

  const dayLabel = (k: string) => new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${k}T12:00:00Z`));
  const timeFmt = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", timeZone });

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Choose a day" className="flex gap-2 overflow-x-auto pb-1">
        {days.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={k === activeDay}
            onClick={() => setDay(k)}
            className={cn(
              "shrink-0 rounded-xl border px-3 py-2 text-sm",
              k === activeDay ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted",
            )}
          >
            {dayLabel(k)}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={activeDay ? `Times on ${dayLabel(activeDay)}` : undefined} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {(activeDay ? byDay.get(activeDay)! : []).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={value === s}
            onClick={() => onChange(value === s ? null : s)}
            className={cn(
              "rounded-lg border px-2 py-2 text-sm tabular-nums",
              value === s ? "border-primary bg-primary-soft font-semibold text-primary" : "border-border hover:border-primary/50",
            )}
          >
            {timeFmt.format(new Date(s))}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Times shown in {timeZone.replaceAll("_", " ")}.</p>
    </div>
  );
}
