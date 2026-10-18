import { Trash2 } from "lucide-react";

import { removeAvailabilityAction, removeTimeOffAction } from "@/app/dashboard/tutor/actions";
import { AddAvailabilityForm, AddTimeOffForm } from "@/app/dashboard/tutor/availability/availability-forms";
import { Alert, Card, CardHeader, Container, PageHeader } from "@/components/ui/primitives";
import { requireRole } from "@/lib/auth";
import { WEEKDAYS } from "@/lib/constants";
import { getSettings } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, minutesToLabel } from "@/lib/utils";

export const metadata = { title: "Availability" };

export default async function AvailabilityPage() {
  const user = await requireRole("tutor", "/dashboard/tutor/availability");
  const supabase = await createClient();
  const [{ data: windows }, { data: timeOff }, settings] = await Promise.all([
    supabase.from("tutor_availability").select("*").eq("tutor_id", user.id).order("weekday").order("start_minute"),
    supabase.from("tutor_time_off").select("*").eq("tutor_id", user.id).gte("ends_at", new Date().toISOString()).order("starts_at"),
    getSettings(),
  ]);
  const tz = user.profile.timezone;

  return (
    <Container className="max-w-4xl py-10">
      <PageHeader title="Availability" description={`Weekly hours are in your time zone: ${tz.replaceAll("_", " ")}. Students see them converted to their own time.`} />
      <Alert tone="info" className="mb-6">
        Students can book start times every 30 minutes inside these windows, at least {settings.minNoticeHours} hours in advance and up to {settings.bookingHorizonDays} days ahead. Times that overlap existing lessons or time off are hidden automatically.
      </Alert>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Weekly schedule" />
          <ul className="divide-y divide-border">
            {WEEKDAYS.map((day, i) => {
              const list = (windows ?? []).filter((w) => w.weekday === i);
              return (
                <li key={day} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="w-28 text-sm font-medium">{day}</span>
                  {list.length === 0 ? <span className="text-sm text-muted-foreground">Unavailable</span> : null}
                  {list.map((w) => (
                    <form key={w.id} action={removeAvailabilityAction} className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-1 pl-3 pr-1 text-sm text-primary">
                      <input type="hidden" name="id" value={w.id} />
                      {minutesToLabel(w.start_minute)}–{minutesToLabel(w.end_minute)}
                      <button type="submit" className="rounded-full p-1 hover:bg-white" aria-label={`Remove ${day} ${minutesToLabel(w.start_minute)} to ${minutesToLabel(w.end_minute)}`}>
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </form>
                  ))}
                </li>
              );
            })}
          </ul>
          <div className="border-t border-border p-5">
            <AddAvailabilityForm />
          </div>
        </Card>

        <Card>
          <CardHeader title="Time off" description="Block holidays or appointments. New bookings cannot be made during these periods." />
          <div className="space-y-4 p-5">
            {(timeOff ?? []).length > 0 ? (
              <ul className="space-y-2">
                {(timeOff ?? []).map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm">
                    <span>
                      {formatDateTime(t.starts_at, tz)} → {formatDateTime(t.ends_at, tz)}
                    </span>
                    {t.note ? <span className="text-muted-foreground">· {t.note}</span> : null}
                    <form action={removeTimeOffAction} className="ml-auto">
                      <input type="hidden" name="id" value={t.id} />
                      <button type="submit" className="text-xs text-danger hover:underline">
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : null}
            <AddTimeOffForm />
          </div>
        </Card>
      </div>
    </Container>
  );
}
