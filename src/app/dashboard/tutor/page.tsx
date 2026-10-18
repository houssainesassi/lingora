import { CalendarCheck, CheckCircle2, Circle, Clock, DollarSign, Star } from "lucide-react";
import Link from "next/link";

import { TutorStatusAlert } from "@/app/dashboard/tutor/status-alert";
import { BOOKING_SELECT, BookingList, type BookingWithPeople } from "@/components/bookings/booking-list";
import { RecentConversations } from "@/components/dashboard/recent-conversations";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, CardHeader, Container, EmptyState, PageHeader, StatCard } from "@/components/ui/primitives";
import { Stars } from "@/components/ui/rating";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tutorCompletion } from "@/lib/tutor-completion";
import { formatPrice, formatRelative } from "@/lib/utils";

export const metadata = { title: "Tutor dashboard" };

export default async function TutorDashboard() {
  const user = await requireRole("tutor", "/dashboard/tutor");
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: tutor }, { data: langs }, { count: availabilityCount }, pending, upcoming, { data: completed }, { data: reviews }, { data: conversations }] = await Promise.all([
    supabase.from("tutor_profiles").select("*").eq("id", user.id).single(),
    supabase.from("tutor_languages").select("teaches, language:languages(name)").eq("tutor_id", user.id),
    supabase.from("tutor_availability").select("id", { count: "exact", head: true }).eq("tutor_id", user.id),
    supabase.from("bookings").select(BOOKING_SELECT).eq("tutor_id", user.id).eq("status", "pending").gte("starts_at", now).order("starts_at").limit(10),
    supabase.from("bookings").select(BOOKING_SELECT).eq("tutor_id", user.id).eq("status", "confirmed").gte("ends_at", now).order("starts_at").limit(10),
    supabase.from("bookings").select("price_cents, currency, duration_minutes, completed_at").eq("tutor_id", user.id).eq("status", "completed"),
    supabase.from("reviews").select("id, rating, comment, created_at, status").eq("tutor_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.rpc("get_my_conversations", { p_limit: 5 }),
  ]);
  if (!tutor) throw new Error("Tutor profile missing");

  const completion = tutorCompletion({ tutor, avatarUrl: user.profile.avatar_url, country: user.profile.country, teachesCount: (langs ?? []).filter((l) => l.teaches).length, availabilityCount: availabilityCount ?? 0 });
  const done = completed ?? [];
  const currency = done[0]?.currency ?? tutor.currency;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const totalValue = done.reduce((s, b) => s + b.price_cents, 0);
  const monthValue = done.filter((b) => b.completed_at && new Date(b.completed_at) >= monthStart).reduce((s, b) => s + b.price_cents, 0);
  const hours = done.reduce((s, b) => s + b.duration_minutes, 0) / 60;
  // Past confirmed lessons that still need to be marked completed.
  const { data: toComplete } = await supabase.from("bookings").select("id").eq("tutor_id", user.id).eq("status", "confirmed").lt("ends_at", now).limit(20);

  return (
    <Container className="py-10">
      <PageHeader
        title={`Hi ${user.profile.full_name.split(" ")[0] || "there"}`}
        description="Manage your profile, requests and lessons."
        action={
          <div className="flex gap-2">
            <ButtonLink href="/dashboard/tutor/profile" variant="secondary">
              Edit profile
            </ButtonLink>
            <ButtonLink href="/dashboard/tutor/availability">Availability</ButtonLink>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <TutorStatusAlert status={tutor.status} rejectionReason={tutor.rejection_reason} canSubmit={completion.canSubmit} />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Completed lessons" value={done.length} icon={<CalendarCheck />} />
            <StatCard label="Hours taught" value={hours.toFixed(1)} icon={<Clock />} />
            <StatCard label="Rating" value={tutor.review_count ? Number(tutor.avg_rating).toFixed(1) : "—"} hint={`${tutor.review_count} reviews`} icon={<Star />} />
            <StatCard label="Lesson value this month" value={formatPrice(monthValue, currency)} hint={`${formatPrice(totalValue, currency)} all time`} icon={<DollarSign />} />
          </div>
          <p className="-mt-3 text-xs text-muted-foreground">Lesson value is the sum of booked prices for completed lessons. Payments are not processed by Lingora yet, so this is not a payout amount.</p>

          {(toComplete ?? []).length > 0 ? (
            <Card className="border-warning/30 bg-warning-soft p-4 text-sm text-warning">
              {(toComplete ?? []).length} past lesson{(toComplete ?? []).length === 1 ? "" : "s"} still need to be marked as completed.{" "}
              <Link href="/bookings?tab=past" className="font-medium underline">
                Review past lessons
              </Link>
            </Card>
          ) : null}

          <section>
            <h2 className="mb-3 font-semibold">Booking requests</h2>
            <BookingList bookings={(pending.data ?? []) as unknown as BookingWithPeople[]} viewerId={user.id} timeZone={user.profile.timezone} emptyTitle="No pending requests" emptyDescription="New requests from students appear here." />
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Upcoming lessons</h2>
            <BookingList bookings={(upcoming.data ?? []) as unknown as BookingWithPeople[]} viewerId={user.id} timeZone={user.profile.timezone} emptyTitle="No upcoming lessons" />
          </section>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Profile completion" description={`${completion.percent}% complete`} />
            <div className="px-5 py-4">
              <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={completion.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
                <div className="h-full rounded-full bg-primary" style={{ width: `${completion.percent}%` }} />
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {completion.items.map((i) => (
                  <li key={i.label} className="flex items-center gap-2">
                    {i.done ? <CheckCircle2 className="size-4 text-success" aria-hidden="true" /> : <Circle className="size-4 text-muted-foreground" aria-hidden="true" />}
                    <span className={i.done ? "text-muted-foreground line-through" : ""}>{i.label}</span>
                    {i.required && !i.done ? <Badge tone="warning">Required</Badge> : null}
                    <span className="sr-only">{i.done ? "done" : "to do"}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-1.5 text-sm">
                <span className="text-muted-foreground">Teaching:</span>
                {(langs ?? []).filter((l) => l.teaches).map((l, i) => <Badge key={i} tone="primary">{l.language?.name}</Badge>)}
              </div>
            </div>
          </Card>

          <RecentConversations conversations={conversations ?? []} title="Student messages" />

          <Card>
            <CardHeader title="Latest reviews" />
            {(reviews ?? []).length === 0 ? (
              <div className="p-5">
                <EmptyState icon={<Star />} title="No reviews yet" description="Students can review you after a completed lesson." />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {(reviews ?? []).map((r) => (
                  <li key={r.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <Stars value={r.rating} />
                      <span className="text-xs text-muted-foreground">{formatRelative(r.created_at)}</span>
                    </div>
                    {r.comment ? <p className="mt-1 line-clamp-3 text-sm">{r.comment}</p> : null}
                    {r.status === "hidden" ? <p className="text-xs text-muted-foreground">Hidden by a moderator</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Container>
  );
}
