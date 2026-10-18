import Link from "next/link";

import { BOOKING_SELECT, BookingList, type BookingWithPeople } from "@/components/bookings/booking-list";
import { ButtonLink } from "@/components/ui/button";
import { Container, PageHeader } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Lessons" };

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "requests", label: "Requests" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export default async function BookingsPage({ searchParams }: PageProps<"/bookings">) {
  const user = await requireUser("/bookings");
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tab)?.key ?? "upcoming";
  const supabase = await createClient();
  const now = new Date().toISOString();

  let query = supabase.from("bookings").select(BOOKING_SELECT).or(`student_id.eq.${user.id},tutor_id.eq.${user.id}`);
  if (tab === "upcoming") query = query.eq("status", "confirmed").gte("ends_at", now).order("starts_at");
  if (tab === "requests") query = query.eq("status", "pending").order("starts_at");
  if (tab === "past") query = query.or(`status.eq.completed,and(status.eq.confirmed,ends_at.lt.${now})`).order("starts_at", { ascending: false });
  if (tab === "cancelled") query = query.in("status", ["cancelled", "rejected"]).order("starts_at", { ascending: false });

  const { data, error } = await query.limit(100);
  const bookings = (data ?? []) as unknown as BookingWithPeople[];

  const empty = {
    upcoming: ["No upcoming lessons", "Confirmed lessons appear here."],
    requests: ["No pending requests", user.profile.role === "tutor" ? "New booking requests from students appear here." : "Lessons waiting for tutor confirmation appear here."],
    past: ["No past lessons yet", "Completed lessons and your reviews appear here."],
    cancelled: ["Nothing here", "Cancelled and declined lessons appear here."],
  }[tab];

  return (
    <Container className="py-10">
      <PageHeader
        title="Lessons"
        description={`Times are shown in ${user.profile.timezone.replaceAll("_", " ")}.`}
        action={user.profile.role !== "tutor" ? <ButtonLink href="/tutors">Book a new lesson</ButtonLink> : <ButtonLink href="/dashboard/tutor/availability" variant="secondary">Manage availability</ButtonLink>}
      />
      <nav aria-label="Lesson filters" className="mb-4 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "upcoming" ? "/bookings" : `/bookings?tab=${t.key}`}
            aria-current={t.key === tab ? "page" : undefined}
            className={cn("rounded-xl px-4 py-2 text-sm", t.key === tab ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {error ? <p className="text-sm text-danger">Could not load lessons.</p> : <BookingList bookings={bookings} viewerId={user.id} timeZone={user.profile.timezone} emptyTitle={empty[0]} emptyDescription={empty[1]} />}
    </Container>
  );
}
