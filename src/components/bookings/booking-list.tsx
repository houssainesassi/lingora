import { CalendarClock } from "lucide-react";
import Link from "next/link";

import { BookingStatusBadge } from "@/components/bookings/booking-status-badge";
import { Avatar, EmptyState } from "@/components/ui/primitives";
import { LESSON_TYPE_LABEL } from "@/lib/constants";
import type { Booking } from "@/lib/types";
import { formatDateTime, formatPrice, formatTime } from "@/lib/utils";

export type BookingWithPeople = Booking & {
  student: { full_name: string; avatar_url: string | null } | null;
  tutor: { profile: { full_name: string; avatar_url: string | null } | null } | null;
  language: { name: string } | null;
};

export const BOOKING_SELECT =
  "*, student:profiles!bookings_student_id_fkey(full_name, avatar_url), tutor:tutor_profiles!bookings_tutor_id_fkey(profile:profiles!tutor_profiles_id_fkey(full_name, avatar_url)), language:languages(name)";

export function BookingList({ bookings, viewerId, timeZone, emptyTitle, emptyDescription }: { bookings: BookingWithPeople[]; viewerId: string; timeZone: string; emptyTitle: string; emptyDescription?: string }) {
  if (bookings.length === 0) return <EmptyState icon={<CalendarClock />} title={emptyTitle} description={emptyDescription} />;
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {bookings.map((b) => {
        const asTutor = b.tutor_id === viewerId;
        const other = asTutor ? b.student : b.tutor?.profile;
        return (
          <li key={b.id}>
            <Link href={`/bookings/${b.id}`} className="flex flex-wrap items-center gap-4 px-4 py-4 hover:bg-muted/60 sm:flex-nowrap">
              <Avatar src={other?.avatar_url} name={other?.full_name} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {b.language?.name ?? b.language_code} · {LESSON_TYPE_LABEL[b.lesson_type]}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {asTutor ? "Student" : "Tutor"}: {other?.full_name ?? "Unknown"}
                </p>
              </div>
              <div className="text-sm sm:text-right">
                <p className="font-medium tabular-nums">
                  {formatDateTime(b.starts_at, timeZone)}–{formatTime(b.ends_at, timeZone)}
                </p>
                <p className="text-muted-foreground">
                  {b.duration_minutes} min · {formatPrice(b.price_cents, b.currency)}
                </p>
              </div>
              <div className="w-28 text-right">
                <BookingStatusBadge status={b.status} />
                {b.reschedule_starts_at ? <p className="mt-1 text-xs text-warning">New time proposed</p> : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
